import Joi from "joi";
import { Context } from "koa";
import {
  UpsertMentorProfileDto,
  UpsertMentorProfileService,
} from "../../services/in/upsert-mentor-profile.service";
import { Validate } from "../../lib/decorators/validate.decorator";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { MentorGame, UserRole } from "@prisma/client";
import { GetCurrentUserMentorProfileService } from "../../services/in/get-current-user-mentor-profile.service/get-current-user-mentor-profile.service";
import { MentorProfileService } from "../../services/out/mentorProfile.service";
import { HttpError } from "../../lib/formatters/httpError";

export class MentorProfileController {
  static async getFiltersOptions(ctx: Context) {
    const result = await MentorProfileService.getFiltersOptions();
    ctx.status = 200;
    ctx.body = result;
  }

  static async getMentorProfiles(ctx: Context) {
    const query = ctx.request.query.query as string | undefined;
    const page = ctx.request.query.page
      ? parseInt(ctx.request.query.page as string, 10)
      : undefined;
    const take = ctx.request.query.take
      ? parseInt(ctx.request.query.take as string, 10)
      : undefined;
    const ratingMinParam = ctx.request.query.ratingMin as string | undefined;
    const ratingMaxParam = ctx.request.query.ratingMax as string | undefined;
    const tagsParam = ctx.request.query.tags;
    const tags = Array.isArray(tagsParam)
      ? (tagsParam as string[])
      : tagsParam
        ? [tagsParam as string]
        : undefined;
    const ratingMin =
      ratingMinParam != null && ratingMinParam !== ""
        ? parseFloat(ratingMinParam)
        : undefined;
    const ratingMax =
      ratingMaxParam != null && ratingMaxParam !== ""
        ? parseFloat(ratingMaxParam)
        : undefined;

    const { mentorProfiles, totalCount } =
      await MentorProfileService.getMentorProfiles({
        query,
        page,
        take,
        ratingMin: Number.isNaN(ratingMin) ? undefined : ratingMin,
        ratingMax: Number.isNaN(ratingMax) ? undefined : ratingMax,
        tags: tags?.length ? tags : undefined,
      });
    ctx.status = 200;
    ctx.body = { mentorProfiles, totalCount };
  }

  static async getBySlug(ctx: Context) {
    const slug = ctx.params.slug;
    if (!slug) {
      throw new HttpError(400, "Slug parameter is required");
    }

    const mentorProfile = await MentorProfileService.getBySlug(slug);
    ctx.status = 200;
    ctx.body = { mentorProfile };
  }

  @AuthRequired([UserRole.MENTOR])
  static async getCurrentUserProfile(ctx: Context) {
    const userId = ctx.state.user.id;
    const mentorProfile = await GetCurrentUserMentorProfileService.get(userId);
    ctx.status = 200;
    ctx.body = { mentorProfile };
  }

  @AuthRequired([UserRole.MENTOR])
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
      price: Joi.number().required().min(0),
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
