import Joi from "joi";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { Validate } from "../../lib/decorators/validate.decorator";
import { Context } from "koa";
import { CreateSessionService } from "../../services/in/create-session.service";
import { SessionType } from "@prisma/client";
import { GetUserVibeCheckSessionService } from "../../services/in/get-user-vibe-check-session.service";

export class SessionController {
  @AuthRequired()
  @Validate(
    Joi.object({
      sessions: Joi.array()
        .items(
          Joi.object({
            date: Joi.string().required(),
            startTime: Joi.string()
              .pattern(/^\d{2}:\d{2}$/)
              .required(),
          }),
        )
        .min(1)
        .required(),
      mentorSlug: Joi.string().required(),
      sessionType: Joi.string()
        .valid(...Object.values(SessionType))
        .required(),
    }),
  )
  static async createSession(ctx: Context) {
    const user = ctx.state.user;
    const { mentorSlug, sessionType, sessions } = ctx.request.body as {
      sessions: { date: string; startTime: string }[];
      mentorSlug: string;
      sessionType: SessionType;
    };

    const sessionsResp = await CreateSessionService.create({
      mentorSlug,
      sessionType,
      sessions,
      userId: user.id,
    });

    ctx.status = 201;
    ctx.body = { sessions: sessionsResp };
  }

  @AuthRequired()
  static async hasVibeCheckSession(ctx: Context) {
    const user = ctx.state.user;
    const { mentorSlug } = ctx.params as { mentorSlug: string };

    const session = await GetUserVibeCheckSessionService.getVibeCheckSession(
      user.id,
      mentorSlug,
    );

    ctx.status = 200;
    ctx.body = { session };
  }
}
