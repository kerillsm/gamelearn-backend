import Joi from "joi";
import { Context } from "koa";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { Validate } from "../../lib/decorators/validate.decorator";
import { StartConnectOnboardingService } from "../../services/in/start-connect-onboarding.service";
import { GetConnectStatusService } from "../../services/in/get-connect-status.service";
import { GetUserBalanceService } from "../../services/in/get-user-balance.service";
import { PlatformPayoutService } from "../../services/in/platform-payout.service";

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
  static async getBalance(ctx: Context) {
    const user = ctx.state.user!;
    const result = await GetUserBalanceService.execute(user.id);
    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      amountCents: Joi.number().integer().min(1).required(),
      currency: Joi.string().optional().default("usd"),
    }),
  )
  static async requestPlatformPayout(ctx: Context) {
    const body = ctx.request.body as { amountCents: number; currency?: string };
    const result = await PlatformPayoutService.execute({
      amountCents: body.amountCents,
      currency: body.currency ?? "usd",
    });
    ctx.status = 200;
    ctx.body = result;
  }
}
