import Joi from "joi";
import { Context } from "koa";
import { Validate } from "../../lib/decorators/validate.decorator";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { MentorProfileService } from "../../services/out/mentorProfile.service";
import { GetUserTestimonialBySlugService } from "../../services/in/get-user-testimonial-by-slug.service";
import { UpsertTestimonialService } from "../../services/in/upsert-testimonial.service";
import { TestimonialService } from "../../services/out/testimonial.service";

export class TestimonialController {
  @AuthRequired()
  static async getPendingTestimonialsMentorProfiles(ctx: Context) {
    const userId = ctx.state.user.id!;
    const mentorProfiles =
      await MentorProfileService.getPendingTestimonialsProfiles(userId);

    ctx.status = 200;
    ctx.body = { mentorProfiles };
  }

  @AuthRequired()
  static async getUserTestimonialBySlug(ctx: Context) {
    const userId = ctx.state.user.id!;
    const slug = ctx.params.slug;
    const testimonial = await GetUserTestimonialBySlugService.execute(
      userId,
      slug,
    );
    ctx.status = 200;
    ctx.body = { testimonial };
  }

  @AuthRequired()
  @Validate(
    Joi.object({
      rating: Joi.number().min(1).max(5).required(),
      content: Joi.string().min(5).max(5000).required(),
    }),
  )
  static async upsertTestimonial(ctx: Context) {
    const userId = ctx.state.user.id!;
    const slug = ctx.params.slug;
    const { rating, content } = ctx.request.body as {
      rating: number;
      content: string;
    };

    const testimonial = await UpsertTestimonialService.upsertTestimonial(
      userId,
      slug,
      { rating, content },
    );

    ctx.status = 200;
    ctx.body = { testimonial };
  }

  @AuthRequired()
  static async getUserTestimonials(ctx: Context) {
    const userId = ctx.state.user.id!;
    const testimonials =
      await TestimonialService.getTestimonialsGivenByUser(userId);

    ctx.status = 200;
    ctx.body = { testimonials };
  }

  static async getLatestTestimonials(ctx: Context) {
    const testimonials = await TestimonialService.getLatestTestimonials();

    ctx.status = 200;
    ctx.body = { testimonials };
  }
}
