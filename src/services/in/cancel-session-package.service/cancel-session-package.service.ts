import * as Sentry from "@sentry/node";
import { SessionPackStatus, SessionStatus } from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import { UserService } from "../../out/user.service";
import { StripeService } from "../../out/stripe.service";
import { PayoutSplitService } from "../../out/payout-split.service";
import {
  EmailService,
  buildApplicantCanceledSessionPackageEmail,
  buildMentorCanceledSessionPackageEmail,
} from "../../out/email.service";

export class CancelSessionPackageService {
  static async execute(
    sessionPackageId: string,
    userId: string,
    reason?: string,
  ) {
    const sessionPackage =
      await SessionPackageService.getById(sessionPackageId);
    if (!sessionPackage) {
      throw new HttpError(404, "Session package not found");
    }

    // Determine if user is applicant or mentor
    const isApplicant = sessionPackage.applicantId === userId;
    const isMentor = sessionPackage.mentorId === userId;

    if (!isApplicant && !isMentor) {
      throw new HttpError(403, "Not authorized to cancel this package");
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

    let refundAmount = 0;
    let newStatus: SessionPackStatus;

    if (isApplicant) {
      // Applicant cancellation logic
      const hasPayedOrApprovedSession = sessionPackage.sessions.some(
        (session) =>
          session.status === SessionStatus.PAYED ||
          session.status === SessionStatus.APPROVED,
      );

      if (!hasPayedOrApprovedSession) {
        throw new HttpError(
          400,
          "Cannot cancel package without at least one paid or approved session",
        );
      }

      if (
        sessionPackage.status !== SessionPackStatus.PAYED &&
        sessionPackage.status !== SessionPackStatus.APPROVED
      ) {
        throw new HttpError(
          400,
          "Can only cancel packages with PAYED or APPROVED status",
        );
      }

      // Check refund conditions
      const hasCompletedSession = sessionPackage.sessions.some(
        (session) => session.status === SessionStatus.COMPLETED,
      );

      const earliestSession = sessionPackage.sessions
        .filter(
          (s) =>
            s.status === SessionStatus.PAYED ||
            s.status === SessionStatus.APPROVED,
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        )[0];

      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      const sessionStartsSoon =
        earliestSession &&
        new Date(earliestSession.scheduledAt) <= oneHourFromNow;

      // If completed session exists OR session starts within 1 hour: no refund
      if (hasCompletedSession || sessionStartsSoon) {
        refundAmount = 0;
      } else {
        // Full refund
        refundAmount = sessionPackage.price;
      }

      newStatus = SessionPackStatus.CANCELED_BY_APPLICANT;
    } else {
      // Mentor cancellation logic
      if (sessionPackage.status !== SessionPackStatus.APPROVED) {
        throw new HttpError(
          400,
          "Mentors can only cancel APPROVED packages. Use rejection for PAYED packages.",
        );
      }

      // Mentor cancellation always grants full refund
      refundAmount = sessionPackage.price;
      newStatus = SessionPackStatus.CANCELED_BY_MENTOR;
    }

    // Process refund if amount > 0
    let stripeRefundId: string | null = null;
    if (refundAmount > 0 && sessionPackage.stripePaymentIntentId) {
      try {
        const refund = await StripeService.createRefund(
          sessionPackage.stripePaymentIntentId,
          refundAmount,
          "requested_by_customer",
        );
        stripeRefundId = refund.id;
        console.log(
          `Refund created for canceled package ${sessionPackage.id}: ${refund.id}, amount: ${refundAmount}`,
        );
      } catch (error) {
        console.error(
          `Failed to create refund for package ${sessionPackage.id}:`,
          error,
        );
        // Send error to Sentry for monitoring
        Sentry.captureException(error, {
          tags: {
            service: "cancel-session-package",
            action: "refund",
          },
          extra: {
            sessionPackageId: sessionPackage.id,
            paymentIntentId: sessionPackage.stripePaymentIntentId,
            userId,
            isApplicant,
            isMentor,
            refundAmount,
          },
        });
        throw new HttpError(
          500,
          "Failed to process refund. Please contact support.",
        );
      }
    }

    // Update package
    await SessionPackageService.update(sessionPackageId, {
      status: newStatus,
      cancellationReason: reason?.trim() || null,
      refundAmount,
      refundedAt: refundAmount > 0 ? new Date() : null,
      stripeRefundId,
    });

    // Update sessions to CANCELED (except completed ones)
    for (const session of sessionPackage.sessions) {
      if (session.status !== SessionStatus.COMPLETED) {
        await SessionService.updateSession(session.id, {
          status: SessionStatus.CANCELED,
        });
      }
    }

    await PayoutSplitService.cancelPendingSplitsBySessionPackageId(
      sessionPackageId,
    );

    const updatedPackage =
      await SessionPackageService.getByIdWithSessions(sessionPackageId);

    // Send notification emails to both parties
    if (updatedPackage) {
      try {
        if (isApplicant) {
          // Applicant canceled - send emails to both
          const emails = buildApplicantCanceledSessionPackageEmail({
            applicant,
            mentor,
            sessions: updatedPackage.sessions,
            sessionPackage: updatedPackage,
            refundAmount,
            reason: reason?.trim() || undefined,
          });
          await EmailService.sendEmail(emails.toApplicant);
          await EmailService.sendEmail(emails.toMentor);
        } else {
          // Mentor canceled - send emails to both
          const emails = buildMentorCanceledSessionPackageEmail({
            applicant,
            mentor,
            sessions: updatedPackage.sessions,
            sessionPackage: updatedPackage,
            reason: reason?.trim() || undefined,
          });
          await EmailService.sendEmail(emails.toApplicant);
          await EmailService.sendEmail(emails.toMentor);
        }
      } catch (error) {
        console.error("Failed to send cancellation email:", error);
        Sentry.captureException(error, {
          tags: {
            service: "cancel-session-package",
            action: "send-email",
          },
          extra: {
            sessionPackageId: sessionPackage.id,
            isApplicant,
            isMentor,
          },
        });
        // Continue even if email fails
      }
    }

    return updatedPackage;
  }
}
