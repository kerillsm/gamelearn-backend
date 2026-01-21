import { MentorProfileStatus } from "@prisma/client";
import { MentorProfileService } from "../../out/mentorProfile.service";

export class GetCurrentUserMentorProfileService {
  static async get(userId: string) {
    const rejectedMentorProfile = await MentorProfileService.getByUserId(
      userId,
      MentorProfileStatus.REJECTED,
    );
    if (rejectedMentorProfile) {
      return rejectedMentorProfile;
    }

    const disabledMentorProfile = await MentorProfileService.getByUserId(
      userId,
      MentorProfileStatus.DISABLED,
    );
    if (disabledMentorProfile) {
      return disabledMentorProfile;
    }

    const pendingMentorProfile = await MentorProfileService.getByUserId(
      userId,
      MentorProfileStatus.PENDING,
    );
    if (pendingMentorProfile) {
      return pendingMentorProfile;
    }

    return MentorProfileService.getByUserId(userId, MentorProfileStatus.ACTIVE);
  }
}
