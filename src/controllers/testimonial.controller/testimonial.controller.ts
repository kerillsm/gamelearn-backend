import Joi from "joi";
import { TestimonialStatus, UserRole } from "@prisma/client";
import { Context } from "koa";
import { Validate } from "../../lib/decorators/validate.decorator";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import { MentorProfileService } from "../../services/out/mentorProfile.service";
import { GetUserTestimonialBySlugService } from "../../services/in/get-user-testimonial-by-slug.service";
import { UpsertTestimonialService } from "../../services/in/upsert-testimonial.service";
import { TestimonialService } from "../../services/out/testimonial.service";
import { GetMentorTestimonialsBySlugService } from "../../services/in/get-mentor-testimonials-by-slug.service";
import { serializeTestimonial } from "../../lib/serialization";

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
    ctx.body = {
      testimonial: testimonial
        ? await serializeTestimonial(testimonial, String(userId))
        : null,
    };
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
    ctx.body = {
      testimonial: await serializeTestimonial(testimonial, String(userId)),
    };
  }

  @AuthRequired()
  static async getUserTestimonials(ctx: Context) {
    const userId = ctx.state.user.id!;
    const testimonials =
      await TestimonialService.getTestimonialsGivenByUser(userId);
    ctx.status = 200;
    ctx.body = {
      testimonials: await Promise.all(
        testimonials.map((t) => serializeTestimonial(t, String(userId))),
      ),
    };
  }

  static async getLatestTestimonials(ctx: Context) {
    const testimonials = await TestimonialService.getLatestTestimonials();
    ctx.status = 200;
    ctx.body = {
      testimonials: await Promise.all(
        testimonials.map((t) => serializeTestimonial(t, undefined)),
      ),
    };
  }

  static async getMentorTestimonials(ctx: Context) {
    const slug = ctx.params.slug;
    const take = Number(ctx.query.take) || 4;

    const { testimonials, count, average } =
      await GetMentorTestimonialsBySlugService.execute(slug, take);

    ctx.status = 200;
    ctx.body = {
      testimonials: await Promise.all(
        testimonials.map((t) => serializeTestimonial(t, undefined)),
      ),
      count,
      average,
    };
  }

  @AuthRequired([UserRole.ADMIN])
  static async getAdminPendingTestimonials(ctx: Context) {
    const page = Math.max(1, Number(ctx.query.page) || 1);
    const take = Math.min(100, Math.max(1, Number(ctx.query.take) || 10));
    const skip = (page - 1) * take;
    const { list, totalCount } =
      await TestimonialService.getPendingTestimonials(skip, take);
    ctx.status = 200;
    ctx.body = {
      testimonials: await Promise.all(
        list.map((t) => serializeTestimonial(t, undefined)),
      ),
      totalCount,
    };
  }

  @AuthRequired([UserRole.ADMIN])
  static async approveTestimonial(ctx: Context) {
    const { id } = ctx.params;
    await TestimonialService.updateTestimonialStatus(
      id,
      TestimonialStatus.APPROVED,
    );
    ctx.status = 200;
    ctx.body = { ok: true };
  }

  @AuthRequired([UserRole.ADMIN])
  static async rejectTestimonial(ctx: Context) {
    const { id } = ctx.params;
    await TestimonialService.updateTestimonialStatus(
      id,
      TestimonialStatus.REJECTED,
    );
    ctx.status = 200;
    ctx.body = { ok: true };
  }
}
