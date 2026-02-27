import { SessionPackageService } from "../../out/sessionPackage.service";
import {
  EmailService,
  buildApplicantSessionCheckoutExpiredEmail,
} from "../../out/email.service";

export class HandleCheckoutExpiredService {
  static async execute(stripeSessionPackageId: string) {
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
