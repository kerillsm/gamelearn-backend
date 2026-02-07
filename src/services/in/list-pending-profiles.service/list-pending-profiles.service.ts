import { MentorProfileStatus } from "@prisma/client";
import { MentorProfileService } from "../../out/mentorProfile.service";

export class ListPendingProfilesService {
  static async execute() {
    const pendingProfiles =
      await MentorProfileService.getPendingProfiles();
    const mentorProfiles = await Promise.all(
      pendingProfiles.map(async (pending) => {
        const activeVersion = await MentorProfileService.getByUserId(
          pending.userId,
          MentorProfileStatus.ACTIVE,
        );
        return {
          pending,
          ...(activeVersion && { activeVersion }),
        };
      }),
    );
    return { mentorProfiles };
  }
}
