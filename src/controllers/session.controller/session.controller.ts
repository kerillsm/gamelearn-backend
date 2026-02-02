import Joi from "joi";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { Validate } from "../../lib/decorators/validate.decorator";
import { Context } from "koa";
import { CreateSessionService } from "../../services/in/create-session.service";
import { SessionType } from "@prisma/client";
import { GetUserVibeCheckSessionService } from "../../services/in/get-user-vibe-check-session.service";
import { CancelPendingSessionsService } from "../../services/in/cancel-pending-sessions.service";
import { ApproveSessionService } from "../../services/in/approve-session.service";
import { RejectSessionService } from "../../services/in/reject-session.service";
import { SetVenueService } from "../../services/in/set-venue.service";

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

    const result = await CreateSessionService.create({
      mentorSlug,
      sessionType,
      sessions,
      userId: user.id,
    });

    ctx.status = 201;
    ctx.body = {
      sessions: result.sessions,
      checkoutUrl: result.checkoutUrl,
    };
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

  @AuthRequired()
  @Validate(
    Joi.object({
      sessionIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    }),
  )
  static async cancelPendingSessions(ctx: Context) {
    const user = ctx.state.user;
    const { sessionIds } = ctx.request.body as { sessionIds: string[] };

    const result = await CancelPendingSessionsService.execute(
      sessionIds,
      user.id,
    );

    ctx.status = 200;
    ctx.body = { deleted: result.count };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      venue: Joi.string().required(),
    }),
  )
  static async approveSession(ctx: Context) {
    const user = ctx.state.user;
    const { sessionId } = ctx.params as { sessionId: string };
    const { venue } = ctx.request.body as { venue: string };

    const session = await ApproveSessionService.execute(
      sessionId,
      user.id,
      venue,
    );

    ctx.status = 200;
    ctx.body = { session };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      reason: Joi.string().optional(),
    }),
  )
  static async rejectSession(ctx: Context) {
    const user = ctx.state.user;
    const { sessionId } = ctx.params as { sessionId: string };
    const { reason } = ctx.request.body as { reason?: string };

    const session = await RejectSessionService.execute(
      sessionId,
      user.id,
      reason,
    );

    ctx.status = 200;
    ctx.body = { session };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      venue: Joi.string().required(),
    }),
  )
  static async setVenue(ctx: Context) {
    const user = ctx.state.user;
    const { sessionId } = ctx.params as { sessionId: string };
    const { venue } = ctx.request.body as { venue: string };

    const session = await SetVenueService.execute(
      sessionId,
      user.id,
      venue,
    );

    ctx.status = 200;
    ctx.body = { session };
  }
}
