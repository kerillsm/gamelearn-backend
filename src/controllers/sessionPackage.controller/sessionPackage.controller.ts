import Joi from "joi";
import { SessionPackageType, UserRole } from "@prisma/client";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { Validate } from "../../lib/decorators/validate.decorator";
import { Context } from "koa";
import { BookSessionPackageService } from "../../services/in/book-session-package.service";
import { GetUserVibeCheckSessionService } from "../../services/in/get-user-vibe-check-session.service";
import { ListSessionPackagesService } from "../../services/in/list-session-packages.service";
import { CancelPendingSessionPackageService } from "../../services/in/cancel-pending-session-package.service";
import { ApproveSessionPackageService } from "../../services/in/approve-session-package.service";
import { RejectSessionPackageService } from "../../services/in/reject-session-package.service";
import { CancelSessionPackageService } from "../../services/in/cancel-session-package.service/cancel-session-package.service";
import { CreateDisputeService } from "../../services/in/create-dispute.service";

export class SessionPackageController {
  @AuthRequired()
  static async getMySessionPackages(ctx: Context) {
    const user = ctx.state.user;
    const { page, status } = ctx.query as { page?: string; status?: string };

    const result = await ListSessionPackagesService.listUserSessionPackages(
      user.id,
      page ? parseInt(page, 10) : 1,
      status,
    );

    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired([UserRole.MENTOR])
  static async getMentorSessionPackages(ctx: Context) {
    const user = ctx.state.user;
    const { page, status, year, monthIndex, all } = ctx.query as {
      page?: string;
      status?: string;
      year?: string;
      monthIndex?: string;
      all?: string;
    };

    const result = await ListSessionPackagesService.listMentorSessionPackages(
      user.id,
      page ? parseInt(page, 10) : 1,
      status,
      year ? parseInt(year, 10) : undefined,
      monthIndex ? parseInt(monthIndex, 10) : undefined,
      all === "true",
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
        .valid(...Object.values(SessionPackageType))
        .required(),
    }),
  )
  static async createSessionPackage(ctx: Context) {
    const user = ctx.state.user;
    const { mentorSlug, sessionType, sessions } = ctx.request.body as {
      sessions: { date: string; startTime: string }[];
      mentorSlug: string;
      sessionType: SessionPackageType;
    };

    const result = await BookSessionPackageService.execute({
      mentorSlug,
      sessionType,
      sessions,
      userId: user.id,
    });

    ctx.status = 201;
    ctx.body = {
      sessionPackage: result.sessionPackage,
      checkoutUrl: result.checkoutUrl,
    };
  }

  @AuthRequired()
  static async hasVibeCheckSession(ctx: Context) {
    const user = ctx.state.user;
    const { mentorSlug } = ctx.params as { mentorSlug: string };

    const result = await GetUserVibeCheckSessionService.getVibeCheckSession(
      user.id,
      mentorSlug,
    );

    ctx.status = 200;
    ctx.body = result;
  }

  @AuthRequired([UserRole.USER])
  @Validate(
    Joi.object({
      sessionPackageId: Joi.string().uuid().required(),
    }),
  )
  static async cancelPendingSessionPackage(ctx: Context) {
    const user = ctx.state.user;
    const { sessionPackageId } = ctx.request.body as {
      sessionPackageId: string;
    };

    await CancelPendingSessionPackageService.execute(sessionPackageId, user.id);

    ctx.status = 200;
    ctx.body = { deleted: true };
  }

  @AuthRequired([UserRole.MENTOR])
  @Validate(
    Joi.object({
      venue: Joi.string().required(),
    }),
  )
  static async approveSessionPackage(ctx: Context) {
    const user = ctx.state.user;
    const { sessionPackageId } = ctx.params as { sessionPackageId: string };
    const { venue } = ctx.request.body as { venue: string };

    const sessionPackage = await ApproveSessionPackageService.execute(
      sessionPackageId,
      user.id,
      venue,
    );

    ctx.status = 200;
    ctx.body = { sessionPackage };
  }

  @AuthRequired([UserRole.MENTOR])
  @Validate(
    Joi.object({
      reason: Joi.string().optional(),
    }),
  )
  static async rejectSessionPackage(ctx: Context) {
    const user = ctx.state.user;
    const { sessionPackageId } = ctx.params as { sessionPackageId: string };
    const { reason } = ctx.request.body as { reason?: string };

    const sessionPackage = await RejectSessionPackageService.execute(
      sessionPackageId,
      user.id,
      reason,
    );

    ctx.status = 200;
    ctx.body = { sessionPackage };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      reason: Joi.string().optional(),
    }),
  )
  static async cancelSessionPackage(ctx: Context) {
    const user = ctx.state.user;
    const { sessionPackageId } = ctx.params as { sessionPackageId: string };
    const { reason } = ctx.request.body as { reason?: string };

    const sessionPackage = await CancelSessionPackageService.execute(
      sessionPackageId,
      user.id,
      reason,
    );

    ctx.status = 200;
    ctx.body = { sessionPackage };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      reason: Joi.string().trim().min(1).required(),
    }),
  )
  static async createDisputeSessionPackage(ctx: Context) {
    const user = ctx.state.user;
    const { sessionPackageId } = ctx.params as { sessionPackageId: string };
    const { reason } = ctx.request.body as { reason: string };

    const sessionPackage = await CreateDisputeService.execute(
      sessionPackageId,
      user.id,
      reason.trim(),
    );

    ctx.status = 200;
    ctx.body = { sessionPackage };
  }
}
