import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { StartConnectOnboardingService } from "../../services/in/start-connect-onboarding.service";
import { GetConnectStatusService } from "../../services/in/get-connect-status.service";
import { GetConnectDashboardLinkService } from "../../services/in/get-connect-dashboard-link.service";
import { PayoutService } from "../../services/out/payout.service";

export class ConnectController {
  @AuthRequired()
  static async startOnboarding(ctx: Context) {
    const user = ctx.state.user!;
    const result = await StartConnectOnboardingService.execute(user.id);

    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired()
  static async getStatus(ctx: Context) {
    const user = ctx.state.user!;
    const result = await GetConnectStatusService.execute(user.id);

    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired()
  static async getDashboardLink(ctx: Context) {
    const user = ctx.state.user!;
    const result = await GetConnectDashboardLinkService.execute(user.id);

    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired()
  static async getEarnings(ctx: Context) {
    const user = ctx.state.user!;
    // Return referral-only earnings (session earnings handled via Stripe destination charges)
    const summary = await PayoutService.getReferralEarningsSummary(user.id);

    ctx.status = 200;
    ctx.body = {
      totalReferralEarnings: summary.totalEarnings,
      totalPaidOut: summary.totalPaidOut,
    };
  }

  @AuthRequired()
  static async getPayoutHistory(ctx: Context) {
    const user = ctx.state.user!;
    const payouts = await PayoutService.getByUserId(user.id);

    ctx.status = 200;
    ctx.body = { payouts };
  }
}
