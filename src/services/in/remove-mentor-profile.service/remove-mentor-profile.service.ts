import { HttpError } from "../../../lib/formatters/httpError";
import { isMockEmail } from "../../../lib/isMockEmail";
import { prisma } from "../../../lib/orm/prisma";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { UserService } from "../../out/user.service";
import { EmailService } from "../../out/email.service";
import { buildMentorProfileRemovedEmail } from "../../out/email.service/builders";

export class RemoveMentorProfileService {
  static async execute(profileId: string, reason?: string) {
    const profile = await prisma.mentorProfile.findUnique({
      where: { id: profileId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    const userEmail = profile.user?.email ?? "";

    if (isMockEmail(userEmail)) {
      await UserService.deleteUser(profile.userId);
      return;
    }

    await MentorProfileService.remove(profileId);

    try {
      await EmailService.sendEmail(
        buildMentorProfileRemovedEmail({
          to: userEmail,
          userName: profile.user?.name ?? "Mentor",
          reason,
        }),
      );
    } catch (error) {
      console.error("Failed to send mentor profile removed email:", error);
    }
  }
}
