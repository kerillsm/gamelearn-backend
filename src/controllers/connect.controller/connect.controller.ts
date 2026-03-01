import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { prisma } from "../../lib/orm/prisma";
import { StartConnectOnboardingService } from "../../services/in/start-connect-onboarding.service";
import { GetConnectStatusService } from "../../services/in/get-connect-status.service";
import { GetConnectDashboardLinkService } from "../../services/in/get-connect-dashboard-link.service";
import { EarningsService } from "../../services/in/earnings.service";

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
    const result = await EarningsService.getEarningsForUser({
      userId: String(user.id),
      userRole: user.role,
    });

    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired()
  static async getPayouts(ctx: Context) {
    const user = ctx.state.user!;
    const payouts = await ConnectController.getPayoutsForUser(String(user.id));
    ctx.status = 200;
    ctx.body = { payouts };
  }

  private static async getPayoutsForUser(userId: string) {
    const rows = await prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((p) => ({
      id: p.id,
      amount: p.amountCents / 100,
      status: p.status === "PAID" ? "COMPLETED" : p.status,
      type: p.targetType === "MENTOR" ? "SESSION_EARNING" : "REFERRAL_BONUS",
      createdAt: p.createdAt.toISOString(),
      processedAt: p.status === "PAID" ? p.updatedAt.toISOString() : null,
      failureReason: null,
    }));
  }
}
