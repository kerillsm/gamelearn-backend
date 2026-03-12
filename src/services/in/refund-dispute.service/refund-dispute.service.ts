import * as Sentry from "@sentry/node";
import {
  PaymentStatus,
  SessionPackStatus,
  SessionStatus,
} from "@prisma/client";
import { HttpError } from "../../../lib/formatters/httpError";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import { StripeService } from "../../out/stripe.service";
import { PayoutSplitService } from "../../out/payout-split.service";
import { PaymentService } from "../../out/payment.service";

export class RefundDisputeService {
  static async execute(sessionPackageId: string) {
    const sessionPackage =
      await SessionPackageService.getById(sessionPackageId);
    if (!sessionPackage) {
      throw new HttpError(404, "Session package not found");
    }

    if (sessionPackage.status !== SessionPackStatus.IN_DISPUTE) {
      throw new HttpError(
        400,
        "Package must be in IN_DISPUTE status to refund",
      );
    }

    let stripeRefundId: string | null = null;
    const refundAmount = sessionPackage.price;

    if (sessionPackage.stripePaymentIntentId) {
      try {
        const refund = await StripeService.createRefund(
          sessionPackage.stripePaymentIntentId,
          undefined,
          "requested_by_customer",
        );
        stripeRefundId = refund.id;
        console.log(
          `Refund created for disputed package ${sessionPackage.id}: ${refund.id}`,
        );
      } catch (error) {
        console.error(
          `Failed to create refund for disputed package ${sessionPackage.id}:`,
          error,
        );
        Sentry.captureException(error, {
          tags: {
            service: "refund-dispute",
            action: "refund",
          },
          extra: {
            sessionPackageId,
            paymentIntentId: sessionPackage.stripePaymentIntentId,
          },
        });
        throw new HttpError(
          500,
          "Failed to process refund. Please try again or contact support.",
        );
      }
    }

    await SessionPackageService.update(sessionPackageId, {
      status: SessionPackStatus.CANCELED,
      stripeRefundId,
      refundAmount,
      refundedAt: new Date(),
    });

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

    const payment =
      await PaymentService.getBySessionPackageId(sessionPackageId);
    if (payment) {
      await PaymentService.update(payment.id, {
        status: PaymentStatus.REFUNDED,
      });
    }

    return SessionPackageService.getByIdWithSessions(sessionPackageId);
  }
}
