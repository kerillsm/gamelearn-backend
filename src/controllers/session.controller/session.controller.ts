import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { Context } from "koa";
import { CompleteSessionService } from "../../services/in/complete-session.service";

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
}
