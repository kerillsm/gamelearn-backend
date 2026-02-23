import { SessionPackStatus } from "@prisma/client";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { TestimonialService } from "../../out/testimonial.service";
import { HttpError } from "../../../lib/formatters/httpError";

export class GetUserTestimonialBySlugService {
  static async execute(userId: string, slug: string) {
    const testimonial = await TestimonialService.getUserTestimonialBySlug(
      userId,
      slug,
    );

    if (!testimonial) {
      const havePackageWithMentor =
        await SessionPackageService.getApplicantPackagesWithMentorBySlug(
          userId,
          slug,
          SessionPackStatus.COMPLETED,
        );

      if (!havePackageWithMentor.length) {
        throw new HttpError(
          403,
          "User has not completed a session with this mentor",
        );
      }
    }

    return testimonial;
  }
}
