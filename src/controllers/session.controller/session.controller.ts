import Joi from "joi";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { Validate } from "../../lib/decorators/validate.decorator";
import { Context } from "koa";
import { CompleteSessionService } from "../../services/in/complete-session.service";
import { CancelSessionService } from "../../services/in/cancel-session.service";

export class SessionController {
  @AuthRequired()
  static async completeSession(ctx: Context) {
    const user = ctx.state.user;
    const { sessionId } = ctx.params as { sessionId: string };

    const result = await CompleteSessionService.execute(sessionId, user.id);

    ctx.status = 200;
    ctx.body = {
      session: result.session,
      mentorPayout: result.mentorPayout,
      referralPayouts: result.referralPayouts,
    };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      reason: Joi.string().optional(),
      asMentor: Joi.boolean().optional(),
    }),
  )
  static async cancelSession(ctx: Context) {
    const user = ctx.state.user;
    const { sessionId } = ctx.params as { sessionId: string };
    const { reason, asMentor } = ctx.request.body as {
      reason?: string;
      asMentor?: boolean;
    };

    const result = await CancelSessionService.execute(
      sessionId,
      user.id,
      asMentor ?? false,
      reason,
    );

    ctx.status = 200;
    ctx.body = {
      session: result.session,
      refund: result.refund,
    };
  }
}
