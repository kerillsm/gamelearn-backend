import Joi from "joi";
import { Context } from "koa";
import { MentorGame } from "@prisma/client";
import { ListAllProfilesService } from "../../services/in/list-all-profiles.service";
import { ListPendingProfilesService } from "../../services/in/list-pending-profiles.service";
import { ApproveMentorProfileService } from "../../services/in/approve-mentor-profile.service";
import { RejectMentorProfileService } from "../../services/in/reject-mentor-profile.service";
import { CreateMockProfileService } from "../../services/in/create-mock-profile.service";
import { RemoveMentorProfileService } from "../../services/in/remove-mentor-profile.service";
import { Validate } from "../../lib/decorators/validate.decorator";
import { HttpError } from "../../lib/formatters/httpError";

export class AdminMentorProfileController {
  static async listAll(ctx: Context) {
    const page = ctx.request.query.page
      ? parseInt(ctx.request.query.page as string, 10)
      : undefined;
    const take = ctx.request.query.take
      ? parseInt(ctx.request.query.take as string, 10)
      : undefined;

    const { mentorProfiles, totalCount } =
      await ListAllProfilesService.execute({ page, take });
    ctx.status = 200;
    ctx.body = { mentorProfiles, totalCount };
  }

  static async listPending(ctx: Context) {
    const { mentorProfiles } = await ListPendingProfilesService.execute();
    ctx.status = 200;
    ctx.body = { mentorProfiles };
  }

  @Validate(
    Joi.object({
      slug: Joi.string().required(),
      name: Joi.string().required(),
      description: Joi.string().required(),
      shortDescription: Joi.string().required(),
      imageUrl: Joi.string().uri().required(),
      game: Joi.string()
        .valid(...Object.values(MentorGame))
        .required(),
      tags: Joi.array().items(Joi.string()).required(),
      gameRating: Joi.number().optional().allow(null),
      price: Joi.number().required().min(0),
      videoUrl: Joi.string().uri().optional().allow(null),
    }),
  )
  static async createMockProfile(ctx: Context) {
    const body = ctx.request.body as Parameters<
      typeof CreateMockProfileService.execute
    >[0];
    const mentorProfile = await CreateMockProfileService.execute(body);
    ctx.status = 200;
    ctx.body = { mentorProfile };
  }

  static async approve(ctx: Context) {
    const id = ctx.params.id;
    if (!id) {
      throw new HttpError(400, "Profile id is required");
    }
    const mentorProfile = await ApproveMentorProfileService.execute(id);
    ctx.status = 200;
    ctx.body = { mentorProfile };
  }

  @Validate(Joi.object({ rejectionReason: Joi.string().required() }))
  static async reject(ctx: Context) {
    const id = ctx.params.id;
    if (!id) {
      throw new HttpError(400, "Profile id is required");
    }
    const body = ctx.request.body as { rejectionReason: string };
    const mentorProfile = await RejectMentorProfileService.execute(
      id,
      body.rejectionReason,
    );
    ctx.status = 200;
    ctx.body = { mentorProfile };
  }

  @Validate(Joi.object({ reason: Joi.string().allow("").optional() }))
  static async remove(ctx: Context) {
    const id = ctx.params.id;
    if (!id) {
      throw new HttpError(400, "Profile id is required");
    }
    const body = (ctx.request.body as { reason?: string }) ?? {};
    await RemoveMentorProfileService.execute(id, body.reason?.trim() || undefined);
    ctx.status = 200;
    ctx.body = { success: true };
  }
}
