import { SessionStatus } from "@prisma/client";
import { SessionService } from "../../out/session.service";
import { HttpError } from "../../../lib/formatters/httpError";
import { TestimonialService } from "../../out/testimonial.service";
import { MentorProfileService } from "../../out/mentorProfile.service";

export class UpsertTestimonialService {
  static async upsertTestimonial(
    userId: string,
    mentorSlug: string,
    data: { rating: number; content: string },
  ) {
    const mentor = await MentorProfileService.getBySlug(mentorSlug);
    if (!mentor) {
      throw new HttpError(404, "Mentor not found.");
    }

    const userSessions = await SessionService.getUserSessionsWithMentor(
      userId,
      mentorSlug,
      SessionStatus.COMPLETED,
    );

    if (userSessions.length === 0) {
      throw new HttpError(
        403,
        "User has not completed any sessions with this mentor.",
      );
    }

    const testimonial = await TestimonialService.getUserTestimonialBySlug(
      userId,
      mentorSlug,
    );

    if (testimonial) {
      return TestimonialService.updateTestimonial(testimonial.id, {
        content: data.content,
        rating: data.rating,
      });
    }

    return TestimonialService.createTestimonial(userId, mentor.userId, {
      rating: data.rating,
      comment: data.content,
    });
  }
}
