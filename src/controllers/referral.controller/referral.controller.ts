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
  @Validate(
    Joi.object({
      acceptReferralRules: Joi.boolean().optional(),
    }).default({}),
  )
  static async generateCode(ctx: Context) {
    const user = ctx.state.user!;
    const body = ctx.request.body as { acceptReferralRules?: boolean };
    const ipAddress = ctx.ip || ctx.request.ip || "unknown";
    const userAgent = ctx.get("User-Agent") || undefined;

    const referralCode = await GenerateReferralCodeService.execute(user.id, {
      acceptReferralRules: body.acceptReferralRules,
      ipAddress,
      userAgent,
    });

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
}
