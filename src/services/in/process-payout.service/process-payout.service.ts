import { PayoutStatus, PayoutType, ReferralEarning, StripeConnectStatus } from "@prisma/client";
import { PayoutService } from "../../out/payout.service";
import { UserService } from "../../out/user.service";
import { StripeService } from "../../out/stripe.service";
import { ReferralService } from "../../out/referral.service";

export class ProcessPayoutService {
  // Session payouts are now handled via Stripe destination charges
  // This service only processes referral bonus payouts

  static async processReferralPayout(earning: ReferralEarning) {
    if (earning.isPaidOut) return null;

    const referrer = await UserService.getById(earning.referrerUserId);
    if (!referrer?.stripeConnectAccountId) return null;
    if (referrer.stripeConnectStatus !== StripeConnectStatus.ACTIVE) return null;

    // Check if already successfully paid out
    const existingPayout = await PayoutService.getCompletedByReferralEarningId(earning.id);
    if (existingPayout) return null;

    const payout = await PayoutService.create({
      userId: referrer.id,
      amount: earning.amount,
      type: PayoutType.REFERRAL_BONUS,
      referralEarningId: earning.id,
      sessionId: earning.sessionId,
    });

    try {
      const transfer = await StripeService.createTransfer(
        referrer.stripeConnectAccountId,
        earning.amount,
        { referralEarningId: earning.id, payoutId: payout.id },
      );

      await PayoutService.updateStatus(
        payout.id,
        PayoutStatus.COMPLETED,
        transfer.id,
      );

      await ReferralService.markEarningPaidOut(earning.id);
      return payout;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await PayoutService.updateStatus(
        payout.id,
        PayoutStatus.FAILED,
        undefined,
        message,
      );
      return null;
    }
  }

  static async processReferralPayouts(sessionId: string) {
    const referralEarnings = await ReferralService.getEarningsBySessionId(sessionId);
    const results: Array<{ earningId: string; success: boolean }> = [];

    for (const earning of referralEarnings) {
      const payout = await this.processReferralPayout(earning);
      results.push({ earningId: earning.id, success: !!payout });
    }

    return results;
  }
}
