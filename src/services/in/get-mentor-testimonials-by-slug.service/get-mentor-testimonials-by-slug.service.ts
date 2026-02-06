import { TestimonialStatus } from "@prisma/client";
import { TestimonialService } from "../../out/testimonial.service";

export class GetMentorTestimonialsBySlugService {
  static async execute(slug: string, take = 10) {
    const testimonialsCount = await TestimonialService.getTestimonialsCount({
      status: TestimonialStatus.APPROVED,
      mentorUser: {
        slug,
      },
    });

    const average = await TestimonialService.getTestimonialsAverageRating({
      status: TestimonialStatus.APPROVED,
      mentorUser: {
        slug,
      },
    });

    const testimonials = await TestimonialService.getMentorTestimonialsBySlug(
      slug,
      take,
    );

    return {
      testimonials,
      count: testimonialsCount,
      average: average._avg?.rating || 0,
    };
  }
}
