import { SessionStatus } from "@prisma/client";
import { SessionService } from "../../out/session.service";
import { TestimonialService } from "../../out/testimonial.service";
import { HttpError } from "../../../lib/formatters/httpError";

export class GetUserTestimonialBySlugService {
  static async execute(userId: string, slug: string) {
    const testimonial = await TestimonialService.getUserTestimonialBySlug(
      userId,
      slug,
    );

    if (!testimonial) {
      const haveSessionWithMentor =
        await SessionService.getUserSessionsWithMentor(
          userId,
          slug,
          SessionStatus.COMPLETED,
        );

      if (!haveSessionWithMentor.length) {
        throw new HttpError(
          403,
          "User has not completed a session with this mentor",
        );
      }
    }

    return testimonial;
  }
}
