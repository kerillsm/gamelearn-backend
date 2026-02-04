import { StripeConnectStatus } from "@prisma/client";
import { nanoid } from "nanoid";
import { ReferralService } from "../../out/referral.service";
import { UserService } from "../../out/user.service";
import { HttpError } from "../../../lib/formatters/httpError";

export class GenerateReferralCodeService {
  static async execute(userId: string) {
    // Check user's Stripe Connect status
    const user = await UserService.getById(userId);
    if (user?.stripeConnectStatus !== StripeConnectStatus.ACTIVE) {
      throw new HttpError(400, "Set up your payout account to create a referral code");
    }

    const existing = await ReferralService.getCodeByUserId(userId);
    if (existing) {
      return existing;
    }

    const code = nanoid(8).toUpperCase();
    return ReferralService.createCode(userId, code);
  }
}
