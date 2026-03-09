import { SessionPackStatus, StripeConnectStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import { UserService } from "../../out/user.service";
import { SessionValidationService } from "../session-validation.service";
import {
  EmailService,
  buildSessionPackageApprovalEmail,
} from "../../out/email.service";

export class ApproveSessionPackageService {
  static async execute(
    sessionPackageId: string,
    mentorUserId: string,
    venue: string,
  ) {
    const sessionPackage =
      await SessionPackageService.getById(sessionPackageId);
    if (!sessionPackage) {
      throw new HttpError(404, "Session package not found");
    }

    if (sessionPackage.mentorId !== mentorUserId) {
      throw new HttpError(403, "Not authorized to approve this package");
    }

    const mentor = await UserService.getById(mentorUserId);
    if (!mentor) {
      throw new HttpError(400, "Mentor not found");
    }

    if (sessionPackage.status !== SessionPackStatus.PAYED) {
      throw new HttpError(400, "Package must be in PAYED status to approve");
    }

    if (!venue || venue.trim() === "") {
      throw new HttpError(400, "Venue is required to approve");
    }

    // Get applicant user for timezone and validate session times
    const applicant = await UserService.getById(sessionPackage.applicantId);
    if (!applicant) {
      throw new HttpError(404, "Applicant not found");
    }

    // Validate all session times are still available
    await SessionValidationService.validateScheduledSessions(
      applicant,
      mentorUserId,
      sessionPackage.type,
      sessionPackage.sessions.map((s) => ({
        scheduledAt: s.scheduledAt,
        duration: s.duration,
      })),
    );

    await SessionPackageService.update(sessionPackageId, {
      status: SessionPackStatus.APPROVED,
      venue: venue.trim(),
    });

    for (const session of sessionPackage.sessions) {
      await SessionService.updateSession(session.id, { status: "APPROVED" });
    }

    const updatedPackage =
      await SessionPackageService.getByIdWithSessions(sessionPackageId);

    // Send approval confirmation email to the applicant
    if (updatedPackage) {
      try {
        await EmailService.sendEmail(
          buildSessionPackageApprovalEmail({
            applicant,
            mentor,
            sessions: updatedPackage.sessions,
            sessionPackage: updatedPackage,
            venue: venue.trim(),
          }),
        );
        console.log(`Approval confirmation email sent to ${applicant.email}`);
      } catch (error) {
        console.error("Failed to send approval confirmation email:", error);
        // Don't throw - email failure should not break the approval flow
      }
    }

    return updatedPackage;
  }
}
