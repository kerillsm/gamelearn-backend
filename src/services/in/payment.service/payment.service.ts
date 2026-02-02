import { SessionStatus } from "@prisma/client";
import { SessionService } from "../../out/session.service";

export class PaymentService {
  static async handleCheckoutCompleted(stripeSessionId: string) {
    const sessions = await SessionService.getByStripeSessionId(stripeSessionId);
    if (sessions.length === 0) {
      console.warn(`No sessions found for stripeSessionId: ${stripeSessionId}`);
      return;
    }

    await SessionService.updateStatusByStripeSessionId(
      stripeSessionId,
      SessionStatus.PAYED,
    );

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
