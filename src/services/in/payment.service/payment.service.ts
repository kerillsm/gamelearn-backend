import { SessionStatus } from "@prisma/client";
import { SessionService } from "../../out/session.service";
import { RecordReferralEarningService } from "../record-referral-earning.service";

export class PaymentService {
  static async handleCheckoutCompleted(
    stripeSessionId: string,
    paymentIntentId: string,
  ) {
    const sessions = await SessionService.getByStripeSessionId(stripeSessionId);
    if (sessions.length === 0) {
      console.warn(`No sessions found for stripeSessionId: ${stripeSessionId}`);
      return;
    }

    // Update status and store payment intent ID for potential refunds
    await SessionService.updateByStripeSessionId(stripeSessionId, {
      status: SessionStatus.PAYED,
      stripePaymentIntentId: paymentIntentId,
    });

    // Record referral earnings for each session
    for (const session of sessions) {
      try {
        await RecordReferralEarningService.execute(session.id);
      } catch (error) {
        console.error(`Failed to record referral earning for session ${session.id}:`, error);
      }
    }

    console.log(
      `Payment completed for ${sessions.length} session(s), stripeSessionId: ${stripeSessionId}`,
    );
  }

  static async handleCheckoutExpired(stripeSessionId: string) {
    const sessions = await SessionService.getByStripeSessionId(stripeSessionId);
    if (sessions.length === 0) {
      console.warn(`No sessions found for stripeSessionId: ${stripeSessionId}`);
      return;
    }

    await SessionService.deleteByStripeSessionId(stripeSessionId);

    console.log(
      `Payment expired/failed - deleted ${sessions.length} session(s), stripeSessionId: ${stripeSessionId}`,
    );
  }
}
