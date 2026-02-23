import { SessionPackStatus } from "@prisma/client";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import { RecordReferralEarningService } from "../record-referral-earning.service";

export class PaymentService {
  static async handleCheckoutCompleted(
    stripeSessionPackageId: string,
    paymentIntentId: string,
  ) {
    const sessionPackage =
      await SessionPackageService.getByStripeSessionPackageId(stripeSessionPackageId);
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

    try {
      await RecordReferralEarningService.execute(sessionPackage.id);
    } catch (error) {
      console.error(
        `Failed to record referral earning for package ${sessionPackage.id}:`,
        error,
      );
    }

    for (const session of sessionPackage.sessions) {
      await SessionService.updateSession(session.id, { status: "PAYED" });
    }

    console.log(
      `Payment completed for package ${sessionPackage.id}, stripeSessionPackageId: ${stripeSessionPackageId}`,
    );
  }

  static async handleCheckoutExpired(stripeSessionPackageId: string) {
    const sessionPackage =
      await SessionPackageService.getByStripeSessionPackageId(stripeSessionPackageId);
    if (!sessionPackage) {
      console.warn(
        `No session package found for stripeSessionPackageId: ${stripeSessionPackageId}`,
      );
      return;
    }

    await SessionPackageService.deleteByStripeSessionPackageId(stripeSessionPackageId);

    console.log(
      `Payment expired - deleted package ${sessionPackage.id}, stripeSessionPackageId: ${stripeSessionPackageId}`,
    );
  }
}
