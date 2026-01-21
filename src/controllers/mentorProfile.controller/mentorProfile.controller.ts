import Joi from "joi";
import { Context } from "koa";
import {
  UpsertMentorProfileDto,
  UpsertMentorProfileService,
} from "../../services/in/upsert-mentor-profile.service";
import { Validate } from "../../lib/decorators/validate.decorator";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { MentorGame } from "@prisma/client";
import { GetCurrentUserMentorProfileService } from "../../services/in/get-current-user-mentor-profile.service/get-current-user-mentor-profile.service";
import { MentorProfileService } from "../../services/out/mentorProfile.service";
import { HttpError } from "../../lib/formatters/httpError";

export class MentorProfileController {
  static async getBySlug(ctx: Context) {
    const slug = ctx.params.slug;
    if (!slug) {
      throw new HttpError(400, "Slug parameter is required");
    }

    const mentorProfile = await MentorProfileService.getBySlug(slug);
    ctx.status = 200;
    ctx.body = { mentorProfile };
  }

  @AuthRequired()
  static async getCurrentUserProfile(ctx: Context) {
    const userId = ctx.state.user.id;
    const mentorProfile = await GetCurrentUserMentorProfileService.get(userId);
    ctx.status = 200;
    ctx.body = { mentorProfile };
  }

  @AuthRequired()
  @Validate(
    Joi.object<Omit<UpsertMentorProfileDto, "userId">>({
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
      videoUrl: Joi.string().uri().optional().allow(null),
    }),
  )
  static async upsertProfile(ctx: Context) {
    const userId = ctx.state.user.id;
    const body = ctx.request.body as unknown as Omit<
      UpsertMentorProfileDto,
      "userId"
    >;
    const mentorProfile = await UpsertMentorProfileService.upsertProfile({
      ...body,
      userId,
    });
    ctx.status = 200;
    ctx.body = { mentorProfile };
  }

  static changeProfileStatus() {}
}
