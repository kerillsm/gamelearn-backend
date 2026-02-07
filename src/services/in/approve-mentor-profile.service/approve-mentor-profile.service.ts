import { MentorProfileStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { MentorProfileService } from "../../out/mentorProfile.service";

export class ApproveMentorProfileService {
  static async execute(pendingProfileId: string) {
    const profile = await MentorProfileService.getById(pendingProfileId);
    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }
    if (profile.status !== MentorProfileStatus.PENDING) {
      throw new HttpError(400, "Profile is not pending approval");
    }

    const activeProfile = await MentorProfileService.getByUserId(
      profile.userId,
      MentorProfileStatus.ACTIVE,
    );
    if (activeProfile) {
      await MentorProfileService.remove(activeProfile.id);
    }

    const updated = await MentorProfileService.updateStatus(
      pendingProfileId,
      MentorProfileStatus.ACTIVE,
    );
    return updated;
  }
}
