import * as Sentry from "@sentry/node";
import { SessionPackStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import { UserService } from "../../out/user.service";
import { StripeService } from "../../out/stripe.service";
import {
  EmailService,
  buildSessionPackageRejectionEmail,
  buildSessionPackageAutoRejectionMentorEmail,
} from "../../out/email.service";

export class RejectSessionPackageService {
  static async execute(
    sessionPackageId: string,
    mentorUserId: string,
    reason?: string,
    notifyMentor?: boolean,
  ) {
    const sessionPackage =
      await SessionPackageService.getById(sessionPackageId);
    if (!sessionPackage) {
      throw new HttpError(404, "Session package not found");
    }

    if (sessionPackage.mentorId !== mentorUserId) {
      throw new HttpError(403, "Not authorized to reject this package");
    }

    if (sessionPackage.status !== SessionPackStatus.PAYED) {
      throw new HttpError(400, "Package must be in PAYED status to reject");
    }

    // Get applicant and mentor for email
    const applicant = await UserService.getById(sessionPackage.applicantId);
    if (!applicant) {
      throw new HttpError(404, "Applicant not found");
    }

    const mentor = await UserService.getById(sessionPackage.mentorId);
    if (!mentor) {
      throw new HttpError(404, "Mentor not found");
    }

    // Process refund if payment exists
    let refund = null;
    if (sessionPackage.stripePaymentIntentId) {
      try {
        refund = await StripeService.createRefund(
          sessionPackage.stripePaymentIntentId,
          undefined,
          "requested_by_customer",
        );
        console.log(
          `Refund created for rejected package ${sessionPackage.id}: ${refund.id}`,
        );
      } catch (error) {
        console.error(
          `Failed to create refund for package ${sessionPackage.id}:`,
          error,
        );
        // Send error to Sentry for monitoring
        Sentry.captureException(error, {
          tags: {
            service: "reject-session-package",
            action: "refund",
          },
          extra: {
            sessionPackageId: sessionPackage.id,
            paymentIntentId: sessionPackage.stripePaymentIntentId,
            mentorId: mentorUserId,
            applicantId: sessionPackage.applicantId,
          },
        });
        // Continue with rejection even if refund fails - admin can handle manually
      }
    }

    await SessionPackageService.update(sessionPackageId, {
      status: SessionPackStatus.REJECTED,
      rejectionReason: reason?.trim() || null,
    });

    for (const session of sessionPackage.sessions) {
      await SessionService.updateSession(session.id, { status: "REJECTED" });
    }

    const updatedPackage =
      await SessionPackageService.getByIdWithSessions(sessionPackageId);

    // Send rejection email to the applicant
    if (updatedPackage) {
      try {
        await EmailService.sendEmail(
          buildSessionPackageRejectionEmail({
            applicant,
            mentor,
            sessions: updatedPackage.sessions,
            sessionPackage: updatedPackage,
            reason: reason?.trim() || undefined,
          }),
        );
        console.log(`Rejection email sent to ${applicant.email}`);
      } catch (error) {
        console.error("Failed to send rejection email:", error);
        // Don't throw - email failure should not break the rejection flow
      }

      // Send notification email to the mentor if requested (for auto-rejection)
      if (notifyMentor) {
        try {
          await EmailService.sendEmail(
            buildSessionPackageAutoRejectionMentorEmail({
              applicant,
              mentor,
              sessions: updatedPackage.sessions,
              sessionPackage: updatedPackage,
              reason: reason?.trim(),
            }),
          );
          console.log(
            `Auto-rejection notification email sent to mentor ${mentor.email}`,
          );
        } catch (error) {
          console.error("Failed to send mentor notification email:", error);
          // Don't throw - email failure should not break the rejection flow
        }
      }
    }

    return updatedPackage;
  }
}
