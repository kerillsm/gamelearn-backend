import { SessionStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionService } from "../../out/session.service";
import { StripeService } from "../../out/stripe.service";
import { ReferralService } from "../../out/referral.service";

export class CancelSessionService {
  static async execute(
    sessionId: string,
    userId: string,
    isMentor: boolean,
    reason?: string,
  ) {
    const session = await SessionService.getById(sessionId);

    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    // Authorization: mentor or customer can cancel
    if (isMentor && session.mentorUserId !== userId) {
      throw new HttpError(403, "You can only cancel your own sessions");
    }
    if (!isMentor && session.userId !== userId) {
      throw new HttpError(403, "You can only cancel your own sessions");
    }

    // Can only cancel PAYED or APPROVED sessions
    if (session.status !== SessionStatus.PAYED && session.status !== SessionStatus.APPROVED) {
      throw new HttpError(400, "Only paid or approved sessions can be canceled");
    }

    // Process refund if payment was made
    let refundResult = null;
    if (session.stripePaymentIntentId && session.price > 0) {
      try {
        refundResult = await StripeService.createRefund(
          session.stripePaymentIntentId,
          undefined, // Full refund
          "requested_by_customer",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        throw new HttpError(500, `Failed to process refund: ${message}`);
      }
    }

    // Delete associated referral earnings (not yet paid out)
    await ReferralService.deleteUnpaidEarningsBySessionId(sessionId);

    // Update session status to CANCELED
    const updatedSession = await SessionService.updateSession(sessionId, {
      status: SessionStatus.CANCELED,
      rejectionReason: reason || (isMentor ? "Cancelled by mentor" : "Cancelled by customer"),
    });

    return {
      session: updatedSession,
      refund: refundResult ? {
        id: refundResult.id,
        amount: refundResult.amount / 100,
        status: refundResult.status,
      } : null,
    };
  }
}
