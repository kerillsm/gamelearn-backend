import Stripe from "stripe";
import { PayoutStatus } from "@prisma/client";

export function mapStripeStatusToPayoutStatus(
  stripeStatus: Stripe.Payout["status"],
): PayoutStatus {
  switch (stripeStatus) {
    case "paid":
      return PayoutStatus.PAID;
    case "pending":
      return PayoutStatus.PENDING;
    case "in_transit":
      return PayoutStatus.IN_TRANSIT;
    case "failed":
      return PayoutStatus.FAILED;
    case "canceled":
      return PayoutStatus.CANCELED;
    default:
      return PayoutStatus.PENDING;
  }
}
