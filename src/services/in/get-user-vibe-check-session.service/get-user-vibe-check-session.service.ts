import { HttpError } from "../../../lib/formatters/httpError";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { SessionPackageService } from "../../out/sessionPackage.service";

export class GetUserVibeCheckSessionService {
  static async getVibeCheckSession(userId: string, mentorSlug: string) {
    const mentorProfile = await MentorProfileService.getBySlug(mentorSlug);
    if (!mentorProfile) {
      throw new HttpError(404, "Mentor profile not found");
    }

    const sessionPackage = await SessionPackageService.getVibeCheckPackage(
      userId,
      mentorProfile.userId,
    );
    return { sessionPackage };
  }
}
