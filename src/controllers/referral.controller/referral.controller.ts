import { Context } from "koa";
import Joi from "joi";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { Validate } from "../../lib/decorators/validate.decorator";
import { GenerateReferralCodeService } from "../../services/in/generate-referral-code.service";
import { ApplyReferralCodeService } from "../../services/in/apply-referral-code.service";
import { ReferralService } from "../../services/out/referral.service";

export class ReferralController {
  @AuthRequired()
  static async getMyCode(ctx: Context) {
    const user = ctx.state.user!;
    const referralCode = await ReferralService.getCodeByUserId(user.id);

    ctx.status = 200;
    ctx.body = { referralCode: referralCode?.code ?? null };
  }

  @AuthRequired()
  static async generateCode(ctx: Context) {
    const user = ctx.state.user!;
    const referralCode = await GenerateReferralCodeService.execute(user.id);

    ctx.status = 201;
    ctx.body = { referralCode: referralCode.code };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      code: Joi.string().required(),
    }),
  )
  static async applyCode(ctx: Context) {
    const user = ctx.state.user!;
    const { code } = ctx.request.body as { code: string };

    const result = await ApplyReferralCodeService.execute(user.id, code);

    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired()
  static async getMyEarnings(ctx: Context) {
    const user = ctx.state.user!;
    const earnings = await ReferralService.getEarningsByUserId(user.id);

    ctx.status = 200;
    ctx.body = { earnings };
  }
}
