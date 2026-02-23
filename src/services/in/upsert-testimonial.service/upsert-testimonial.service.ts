import { SessionPackStatus } from "@prisma/client";
import { SessionPackageService } from "../../out/sessionPackage.service";
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

    const userPackages = await SessionPackageService.getApplicantPackagesWithMentorBySlug(
      userId,
      mentorSlug,
      SessionPackStatus.COMPLETED,
    );

    if (userPackages.length === 0) {
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
