import {
  PayoutStatus,
  PayoutType,
  SessionPackStatus,
  SessionStatus,
  StripeConnectStatus,
} from "@prisma/client";
import { DateTime } from "luxon";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionService } from "../../out/session.service";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { UserService } from "../../out/user.service";
import { StripeService } from "../../out/stripe.service";
import { PayoutService } from "../../out/payout.service";
import { ProcessPayoutService } from "../process-payout.service";

export class CompleteSessionService {
  private static readonly HOURS_AFTER_SESSION_END = 1;

  static async execute(sessionId: string, mentorUserId: string) {
    const session = await SessionService.getByIdWithPackage(sessionId);

    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    if (session.sessionPackage.mentorId !== mentorUserId) {
      throw new HttpError(403, "You can only complete your own sessions");
    }

    if (session.status !== SessionStatus.APPROVED) {
      throw new HttpError(400, "Only approved sessions can be marked as completed");
    }

    const allowedCompleteTime = DateTime.fromJSDate(session.scheduledAt)
      .plus({ minutes: session.duration })
      .plus({ hours: this.HOURS_AFTER_SESSION_END });

    if (DateTime.now() < allowedCompleteTime) {
      throw new HttpError(
        400,
        "Session can only be marked as complete 1 hour after it ends",
      );
    }

    const mentor = await UserService.getById(mentorUserId);
    if (
      !mentor?.stripeConnectAccountId ||
      mentor.stripeConnectStatus !== StripeConnectStatus.ACTIVE
    ) {
      throw new HttpError(400, "Mentor payout account is not active");
    }

    const updatedSession = await SessionService.updateSession(sessionId, {
      status: SessionStatus.COMPLETED,
    });

    const sessionPackageId = session.sessionPackageId;
    const sessionsInPackage =
      await SessionService.findManyBySessionPackageId(sessionPackageId);

    const allCompleted = sessionsInPackage.every(
      (s) => s.status === SessionStatus.COMPLETED,
    );

    let mentorPayout = null;
    let referralPayouts: Awaited<ReturnType<typeof ProcessPayoutService.processReferralPayouts>> = [];
    if (allCompleted) {
      const totalMentorEarnings = sessionsInPackage.reduce(
        (sum, s) => sum + (s.mentorEarnings ?? 0),
        0,
      );
      if (totalMentorEarnings > 0) {
        mentorPayout = await this.processMentorPayout(
          sessionPackageId,
          mentorUserId,
          totalMentorEarnings,
          mentor.stripeConnectAccountId,
        );
      }

      referralPayouts =
        await ProcessPayoutService.processReferralPayouts(sessionPackageId);

      await SessionPackageService.updateStatus(
        sessionPackageId,
        SessionPackStatus.COMPLETED,
      );
    }

    return {
      session: updatedSession,
      mentorPayout,
      referralPayouts,
    };
  }

  private static async processMentorPayout(
    sessionPackageId: string,
    mentorUserId: string,
    totalMentorEarnings: number,
    stripeConnectAccountId: string,
  ) {
    const existingPayout =
      await PayoutService.getCompletedBySessionPackageId(sessionPackageId);
    if (existingPayout) return null;

    const payout = await PayoutService.create({
      userId: mentorUserId,
      amount: totalMentorEarnings,
      type: PayoutType.SESSION_EARNING,
      sessionPackageId,
    });

    try {
      const transfer = await StripeService.createTransfer(
        stripeConnectAccountId,
        totalMentorEarnings,
        { sessionPackageId, payoutId: payout.id },
      );

      await PayoutService.updateStatus(
        payout.id,
        PayoutStatus.COMPLETED,
        transfer.id,
      );
      return { ...payout, status: PayoutStatus.COMPLETED };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await PayoutService.updateStatus(
        payout.id,
        PayoutStatus.FAILED,
        undefined,
        message,
      );
      throw new HttpError(500, `Failed to transfer mentor earnings: ${message}`);
    }
  }
}
