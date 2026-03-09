import { PayoutOwnerType, PayoutStatus, Prisma } from "@prisma/client";
import { PayoutService } from "../../out/payout.service";
import { StripeService } from "../../out/stripe.service";
import { getPlatformAvailableForWithdrawalCents } from "../earnings.service/utils";
import { HttpError } from "../../../lib/formatters/httpError";

export interface PlatformPayoutParams {
  amountCents: number;
  currency?: string;
}

export interface PlatformPayoutResult {
  id: string;
  status: PayoutStatus;
  amountCents: number;
  currency: string;
  stripePayoutId: string;
}

export class PlatformPayoutService {
  static async execute(
    params: PlatformPayoutParams,
  ): Promise<PlatformPayoutResult> {
    const { amountCents, currency = "usd" } = params;

    if (amountCents <= 0) {
      throw new HttpError(400, "Amount must be positive");
    }

    const availableCents = await getPlatformAvailableForWithdrawalCents();
    if (amountCents > availableCents) {
      throw new HttpError(
        400,
        `Insufficient funds. Available: ${(availableCents / 100).toFixed(2)} ${currency.toUpperCase()}`,
      );
    }

    const stripePayout = await StripeService.createPayout(
      amountCents,
      currency,
    );

    const payout = await PayoutService.create({
      ownerType: PayoutOwnerType.PLATFORM,
      userId: null,
      stripeAccountId: null,
      stripePayoutId: stripePayout.id,
      amountCents,
      currency: currency.toLowerCase(),
      status:
        stripePayout.status === "pending"
          ? PayoutStatus.PENDING
          : stripePayout.status === "in_transit"
            ? PayoutStatus.IN_TRANSIT
            : PayoutStatus.PENDING,
    });

    return {
      id: payout.id,
      status: payout.status,
      amountCents: payout.amountCents,
      currency: payout.currency,
      stripePayoutId: payout.stripePayoutId,
    };
  }
}
