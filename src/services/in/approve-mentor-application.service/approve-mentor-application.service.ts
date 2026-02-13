import { MentorApplicationStatus, UserRole } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { MentorApplicationService } from "../../out/mentorApplication.service";
import { UserService } from "../../out/user.service";
import { isValidSlug } from "../upsert-mentor-profile.service/isValidSlug.util";
import { prisma } from "../../../lib/orm/prisma";

const RESERVED_SLUGS = ["me", "admin", "root", "system"];

export class ApproveMentorApplicationService {
  static async execute(applicationId: string, slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();
    if (
      RESERVED_SLUGS.includes(normalizedSlug) ||
      !isValidSlug(normalizedSlug)
    ) {
      throw new HttpError(400, "This slug cannot be used");
    }

    const application = await MentorApplicationService.getById(applicationId);
    if (!application) {
      throw new HttpError(404, "Application not found");
    }
    if (application.status !== MentorApplicationStatus.PENDING) {
      throw new HttpError(400, "Application is not pending");
    }

    const existingUserWithSlug = await prisma.user.findFirst({
      where: { slug: normalizedSlug },
    });
    if (existingUserWithSlug && existingUserWithSlug.id !== application.userId) {
      throw new HttpError(400, "This slug is already taken");
    }

    await MentorApplicationService.updateStatus(
      applicationId,
      MentorApplicationStatus.APPROVED,
    );
    await UserService.updateUser(application.userId, {
      role: UserRole.MENTOR,
      slug: normalizedSlug,
    });

    return MentorApplicationService.getById(applicationId);
  }
}
