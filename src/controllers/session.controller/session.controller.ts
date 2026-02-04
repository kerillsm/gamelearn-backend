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
import { CompleteSessionService } from "../../services/in/complete-session.service";
import { CancelSessionService } from "../../services/in/cancel-session.service";
import { ListSessionsService } from "../../services/in/list-sessions.service";

export class SessionController {
  @AuthRequired()
  static async getMySessions(ctx: Context) {
    const user = ctx.state.user;
    const { page, status } = ctx.query as { page?: string; status?: string };

    const result = await ListSessionsService.listUserSessions(
      user.id,
      page ? parseInt(page, 10) : 1,
      status,
    );

    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired()
  static async getMentorSessions(ctx: Context) {
    const user = ctx.state.user;
    const { page, status } = ctx.query as { page?: string; status?: string };

    const result = await ListSessionsService.listMentorSessions(
      user.id,
      page ? parseInt(page, 10) : 1,
      status,
    );

    ctx.status = 200;
    ctx.body = result;
  }

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
    const { reason, asMentor } = ctx.request.body as { reason?: string; asMentor?: boolean };

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
