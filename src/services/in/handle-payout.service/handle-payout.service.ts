import Stripe from "stripe";
import { PayoutOwnerType } from "@prisma/client";
import { PayoutService } from "../../out/payout.service";
import { UserService } from "../../out/user.service";
import { mapStripeStatusToPayoutStatus } from "./utils";

export class HandlePayoutService {
  static async execute(
    stripePayout: Stripe.Payout,
    stripeAccountId?: string,
  ): Promise<void> {
    const status = mapStripeStatusToPayoutStatus(stripePayout.status);
    const updateData = {
      status,
      arrivalDate: stripePayout.arrival_date
        ? new Date(stripePayout.arrival_date * 1000)
        : undefined,
      failureCode: stripePayout.failure_code ?? undefined,
      failureMessage: stripePayout.failure_message ?? undefined,
    };

    const existing = await PayoutService.findUniqueByStripePayoutId(
      stripePayout.id,
    );

    if (existing) {
      await PayoutService.updateStatus(existing.id, updateData);
      return;
    }

    const ownerType = stripeAccountId
      ? PayoutOwnerType.CONNECTED_ACCOUNT
      : PayoutOwnerType.PLATFORM;
    const userId = stripeAccountId
      ? ((await UserService.getByStripeConnectAccountId(stripeAccountId))?.id ??
        null)
      : null;

    await PayoutService.create({
      ownerType,
      userId,
      stripeAccountId: stripeAccountId ?? null,
      stripePayoutId: stripePayout.id,
      amountCents: stripePayout.amount,
      currency: stripePayout.currency,
      status: updateData.status,
      arrivalDate: updateData.arrivalDate,
      failureCode: updateData.failureCode,
      failureMessage: updateData.failureMessage,
    });
  }
}
