import { PayoutStatus, PayoutType, SessionStatus, StripeConnectStatus } from "@prisma/client";
import { DateTime } from "luxon";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionService } from "../../out/session.service";
import { UserService } from "../../out/user.service";
import { StripeService } from "../../out/stripe.service";
import { PayoutService } from "../../out/payout.service";
import { ProcessPayoutService } from "../process-payout.service";
import { RecordReferralEarningService } from "../record-referral-earning.service";

export class CompleteSessionService {
  private static readonly HOURS_AFTER_SESSION_END = 1;

  static async execute(sessionId: string, mentorUserId: string) {
    const session = await SessionService.getById(sessionId);

    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    if (session.mentorUserId !== mentorUserId) {
      throw new HttpError(403, "You can only complete your own sessions");
    }

    if (session.status !== SessionStatus.APPROVED) {
      throw new HttpError(400, "Only approved sessions can be marked as completed");
    }

    // Validate that 1 hour has passed since session ended
    const allowedCompleteTime = DateTime.fromJSDate(session.scheduledAt)
      .plus({ minutes: session.duration })
      .plus({ hours: this.HOURS_AFTER_SESSION_END });

    if (DateTime.now() < allowedCompleteTime) {
      throw new HttpError(400, "Session can only be marked as complete 1 hour after it ends");
    }

    // Get mentor for transfer
    const mentor = await UserService.getById(mentorUserId);
    if (!mentor?.stripeConnectAccountId || mentor.stripeConnectStatus !== StripeConnectStatus.ACTIVE) {
      throw new HttpError(400, "Mentor payout account is not active");
    }

    // Update session status to COMPLETED
    const updatedSession = await SessionService.updateSession(sessionId, {
      status: SessionStatus.COMPLETED,
    });

    // Transfer mentor earnings
    let mentorPayout = null;
    if (session.mentorEarnings && session.mentorEarnings > 0) {
      mentorPayout = await this.processMentorPayout(session, mentor.stripeConnectAccountId);
    }

    // Record referral earnings for this session (if not already recorded)
    await RecordReferralEarningService.execute(sessionId);

    // Process referral payouts automatically
    const referralPayouts = await ProcessPayoutService.processReferralPayouts(sessionId);

    return {
      session: updatedSession,
      mentorPayout,
      referralPayouts,
    };
  }

  private static async processMentorPayout(
    session: { id: string; mentorUserId: string; mentorEarnings: number | null },
    stripeConnectAccountId: string,
  ) {
    if (!session.mentorEarnings) return null;

    // Check if already paid
    const existingPayout = await PayoutService.getCompletedBySessionId(session.id);
    if (existingPayout) return null;

    // Create payout record
    const payout = await PayoutService.create({
      userId: session.mentorUserId,
      amount: session.mentorEarnings,
      type: PayoutType.SESSION_EARNING,
      sessionId: session.id,
    });

    try {
      // Transfer to mentor's Stripe Connect account
      const transfer = await StripeService.createTransfer(
        stripeConnectAccountId,
        session.mentorEarnings,
        { sessionId: session.id, payoutId: payout.id },
      );

      await PayoutService.updateStatus(payout.id, PayoutStatus.COMPLETED, transfer.id);
      return { ...payout, status: PayoutStatus.COMPLETED };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await PayoutService.updateStatus(payout.id, PayoutStatus.FAILED, undefined, message);
      throw new HttpError(500, `Failed to transfer mentor earnings: ${message}`);
    }
  }
}
