import { SessionPackStatus, SessionStatus } from "@prisma/client";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import {
  EmailService,
  buildApplicantBookingConfirmationEmail,
  buildApplicantSessionCheckoutExpiredEmail,
} from "../../out/email.service";

export class PaymentService {
  static async handleCheckoutCompleted(
    stripeSessionPackageId: string,
    paymentIntentId: string,
  ) {
    const sessionPackage =
      await SessionPackageService.getByStripeSessionPackageId(
        stripeSessionPackageId,
      );
    if (!sessionPackage) {
      console.warn(
        `No session package found for stripeSessionPackageId: ${stripeSessionPackageId}`,
      );
      return;
    }

    await SessionPackageService.updateByStripeSessionPackageId(
      stripeSessionPackageId,
      {
        status: SessionPackStatus.PAYED,
        stripePaymentIntentId: paymentIntentId,
      },
    );

    for (const session of sessionPackage.sessions) {
      await SessionService.updateSession(session.id, {
        status: SessionStatus.PAYED,
      });
    }

    console.log(
      `Payment completed for package ${sessionPackage.id}, stripeSessionPackageId: ${stripeSessionPackageId}`,
    );

    // Send booking confirmation email to the applicant
    try {
      await EmailService.sendEmail(
        buildApplicantBookingConfirmationEmail({
          applicant: sessionPackage.applicant,
          mentor: sessionPackage.mentor,
          sessions: sessionPackage.sessions,
          sessionPackage,
        }),
      );
      console.log(
        `Booking confirmation email sent to ${sessionPackage.applicant.email}`,
      );
    } catch (error) {
      console.error("Failed to send booking confirmation email:", error);
      // Don't throw - email failure should not break the payment flow
    }
  }

  static async handleCheckoutExpired(stripeSessionPackageId: string) {
    const sessionPackage =
      await SessionPackageService.getByStripeSessionPackageId(
        stripeSessionPackageId,
      );
    if (!sessionPackage) {
      console.warn(
        `No session package found for stripeSessionPackageId: ${stripeSessionPackageId}`,
      );
      return;
    }

    try {
      await EmailService.sendEmail(
        buildApplicantSessionCheckoutExpiredEmail({
          applicant: sessionPackage.applicant,
          mentor: sessionPackage.mentor,
          sessions: sessionPackage.sessions,
          sessionPackage,
        }),
      );
      console.log(
        `Checkout expiration email sent to ${sessionPackage.applicant.email}`,
      );
    } catch (error) {
      console.error("Failed to send checkout expiration email:", error);
    }

    await SessionPackageService.deleteByStripeSessionPackageId(
      stripeSessionPackageId,
    );

    console.log(
      `Payment expired - deleted package ${sessionPackage.id}, stripeSessionPackageId: ${stripeSessionPackageId}`,
    );
  }
}
