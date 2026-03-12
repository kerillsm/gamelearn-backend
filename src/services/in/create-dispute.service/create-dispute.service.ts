import { SessionPackStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { appConfig } from "../../../config/appConfig";
import { SessionPackageService } from "../../out/sessionPackage.service";
import {
  EmailService,
  buildDisputeReportedToAdminEmail,
} from "../../out/email.service";

const DISPUTE_WINDOW_MS = 48 * 60 * 60 * 1000;

export class CreateDisputeService {
  static async execute(
    sessionPackageId: string,
    userId: string,
    reason: string,
  ) {
    const sessionPackage =
      await SessionPackageService.getById(sessionPackageId);
    if (!sessionPackage) {
      throw new HttpError(404, "Session package not found");
    }

    if (sessionPackage.status !== SessionPackStatus.COMPLETED) {
      throw new HttpError(400, "Package must be completed to dispute");
    }

    const isApplicant = sessionPackage.applicantId === userId;
    const isMentor = sessionPackage.mentorId === userId;
    if (!isApplicant && !isMentor) {
      throw new HttpError(403, "Not authorized to dispute this package");
    }

    const lastEnd = new Date(sessionPackage.lastSessionEndAt).getTime();
    const now = Date.now();
    if (now - lastEnd > DISPUTE_WINDOW_MS) {
      throw new HttpError(
        400,
        "Dispute window has passed (48 hours)",
      );
    }

    if (!reason || !reason.trim()) {
      throw new HttpError(400, "Reason is required");
    }

    await SessionPackageService.update(sessionPackageId, {
      status: SessionPackStatus.IN_DISPUTE,
      disputeReason: reason.trim(),
    });

    const reporterRole = isApplicant ? "applicant" : "mentor";
    try {
      await EmailService.sendEmail(
        buildDisputeReportedToAdminEmail({
          adminEmail: appConfig.resend.adminEmail,
          applicant: sessionPackage.applicant,
          mentor: sessionPackage.mentor,
          sessionPackageId,
          reporterRole,
          reason,
          frontendUrl: appConfig.frontendUrl,
        }),
      );
      console.log(
        `Dispute notification email sent to admin for package ${sessionPackageId}`,
      );
    } catch (error) {
      console.error("Failed to send dispute email to admin:", error);
    }

    const updatedPackage = await SessionPackageService.getByIdWithSessions(
      sessionPackageId,
    );
    return updatedPackage;
  }
}
