import { MentorProfileStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { MentorProfileService } from "../../out/mentorProfile.service";

export class RejectMentorProfileService {
  static async execute(profileId: string, rejectionReason: string) {
    const profile = await MentorProfileService.getById(profileId);
    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }
    if (profile.status !== MentorProfileStatus.PENDING) {
      throw new HttpError(400, "Profile is not pending approval");
    }

    const updated = await MentorProfileService.updateStatus(
      profileId,
      MentorProfileStatus.REJECTED,
      rejectionReason,
    );
    return updated;
  }
}
