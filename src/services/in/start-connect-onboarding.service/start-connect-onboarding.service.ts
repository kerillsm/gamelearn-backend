import { StripeConnectStatus } from "@prisma/client";
import { UserService } from "../../out/user.service";
import { StripeService } from "../../out/stripe.service";
import { appConfig } from "../../../config/appConfig";
import { HttpError } from "../../../lib/formatters/httpError";

export class StartConnectOnboardingService {
  static async execute(userId: string) {
    const user = await UserService.getById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    let stripeAccountId = user.stripeConnectAccountId;

    // Create Stripe Connect account if not exists
    if (!stripeAccountId) {
      const account = await StripeService.createConnectAccount(user.email);
      stripeAccountId = account.id;

      await UserService.updateUser(userId, {
        stripeConnectAccountId: stripeAccountId,
        stripeConnectStatus: StripeConnectStatus.PENDING,
      });
    }

    // Create account link for onboarding
    const accountLink = await StripeService.createAccountLink(
      stripeAccountId,
      `${appConfig.frontendUrl}/cabinet/earnings?refresh=true`,
      `${appConfig.frontendUrl}/cabinet/earnings?success=true`,
    );

    return { url: accountLink.url };
  }
}
