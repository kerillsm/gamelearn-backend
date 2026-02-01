import { HttpError } from "../../../lib/formatters/httpError";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { SessionService } from "../../out/session.service";

export class GetUserVibeCheckSessionService {
  static async getVibeCheckSession(userId: string, mentorSlug: string) {
    const mentorUserId = await MentorProfileService.getBySlug(mentorSlug);
    if (!mentorUserId) {
      throw new HttpError(404, "Mentor profile not found");
    }

    const session = await SessionService.getVibeCheckSession(
      userId,
      mentorUserId.userId,
    );
    return session;
  }
}
