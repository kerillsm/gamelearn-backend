import { UserService } from "../../out/user.service";
import { StripeService } from "../../out/stripe.service";
import { HttpError } from "../../../lib/formatters/httpError";

export class GetConnectDashboardLinkService {
  static async execute(userId: string) {
    const user = await UserService.getById(userId);
    if (!user?.stripeConnectAccountId) {
      throw new HttpError(400, "Stripe Connect account not set up");
    }

    const loginLink = await StripeService.createLoginLink(user.stripeConnectAccountId);
    return { url: loginLink.url };
  }
}
