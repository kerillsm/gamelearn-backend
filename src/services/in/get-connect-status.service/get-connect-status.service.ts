import { StripeConnectStatus } from "@prisma/client";
import { UserService } from "../../out/user.service";
import { StripeService } from "../../out/stripe.service";
import { HttpError } from "../../../lib/formatters/httpError";

export class GetConnectStatusService {
  static async execute(userId: string) {
    const user = await UserService.getById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (!user.stripeConnectAccountId) {
      return {
        status: StripeConnectStatus.NOT_STARTED,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }

    const account = await StripeService.getAccount(user.stripeConnectAccountId);

    // Update status in database if changed
    let newStatus = user.stripeConnectStatus;
    if (account.charges_enabled && account.payouts_enabled) {
      newStatus = StripeConnectStatus.ACTIVE;
    } else if (account.details_submitted) {
      newStatus = StripeConnectStatus.PENDING;
    } else if (account.requirements?.disabled_reason) {
      newStatus = StripeConnectStatus.RESTRICTED;
    }

    if (newStatus !== user.stripeConnectStatus) {
      await UserService.updateUser(userId, { stripeConnectStatus: newStatus });
    }

    return {
      status: newStatus,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
    };
  }
}
