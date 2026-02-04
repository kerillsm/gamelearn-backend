import { StripeConnectStatus } from "@prisma/client";
import { UserService } from "../../out/user.service";
import { StripeService } from "../../out/stripe.service";

export class HandleConnectAccountUpdatedService {
  static async execute(accountId: string) {
    const user = await UserService.getByStripeConnectAccountId(accountId);
    if (!user) return;

    const account = await StripeService.getAccount(accountId);

    let status: StripeConnectStatus;
    if (account.charges_enabled && account.payouts_enabled) {
      status = StripeConnectStatus.ACTIVE;
    } else if (account.requirements?.disabled_reason) {
      status = StripeConnectStatus.RESTRICTED;
    } else {
      status = StripeConnectStatus.PENDING;
    }

    await UserService.updateUser(user.id, { stripeConnectStatus: status });
  }
}
