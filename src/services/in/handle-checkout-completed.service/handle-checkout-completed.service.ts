import * as Sentry from "@sentry/node";
import Stripe from "stripe";
import {
  LedgerStatus,
  PaymentStatus,
  SessionPackStatus,
  SessionStatus,
} from "@prisma/client";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import { PaymentService } from "../../out/payment.service";
import { LedgerService } from "../../out/ledger.service";
import { UserService } from "../../out/user.service";
import { RejectSessionPackageService } from "../reject-session-package.service";
import {
  EmailService,
  buildApplicantBookingConfirmationEmail,
} from "../../out/email.service";

export class HandleCheckoutCompletedService {
  static async execute(checkoutSession: Stripe.Checkout.Session) {
    const stripeSessionPackageId = checkoutSession.id;
    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : // TODO: handle null
          (checkoutSession.payment_intent?.id ?? "");

    const metadata = checkoutSession.metadata ?? {};

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

    // 1. Update package and sessions status
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

    // 2. Parse fee metadata from Stripe checkout session
    const amountCents = checkoutSession.amount_total ?? 0;
    const platformCommissionPct = parseInt(
      metadata.platformCommissionPct ?? "0",
      10,
    );
    const platformCommissionCents = parseInt(
      metadata.platformCommissionCents ?? "0",
      10,
    );
    const mentorPayoutCents = parseInt(metadata.mentorPayoutCents ?? "0", 10);
    const clientReferralBonusCents = parseInt(
      metadata.clientReferralBonusCents ?? "0",
      10,
    );
    const mentorReferralBonusCents = parseInt(
      metadata.mentorReferralBonusCents ?? "0",
      10,
    );
    const mentorUserId = metadata.mentorUserId;
    const clientReferralId = metadata.clientReferralId ?? null;
    const mentorReferralId = metadata.mentorReferralId ?? null;
    const clientReferrerUserId = metadata.clientReferrerUserId ?? null;
    const mentorReferrerUserId = metadata.mentorReferrerUserId ?? null;

    // 3. Create Payment record
    const payment = await PaymentService.create({
      sessionPackageId: sessionPackage.id,
      stripePaymentIntentId: paymentIntentId,
      amountCents,
      currency: checkoutSession.currency ?? "usd",
      platformCommissionPct,
      platformCommissionCents,
      mentorPayoutCents,
      status: PaymentStatus.SUCCEEDED,
    });

    // 4. Find/create LedgerAccounts — reject package if users are missing
    if (!mentorUserId) {
      Sentry.captureException(
        new Error("Missing mentorUserId in checkout metadata"),
        {
          tags: { service: "HandleCheckoutCompletedService" },
          extra: { stripeSessionPackageId, metadata },
        },
      );
      await this.rejectPackageSafely(
        sessionPackage.id,
        sessionPackage.mentorId,
      );
      return;
    }

    const mentorUser = await UserService.getById(mentorUserId);
    if (!mentorUser) {
      Sentry.captureException(
        new Error(`Mentor user not found: ${mentorUserId}`),
        {
          tags: { service: "HandleCheckoutCompletedService" },
          extra: { sessionPackageId: sessionPackage.id, mentorUserId },
        },
      );
      await this.rejectPackageSafely(
        sessionPackage.id,
        sessionPackage.mentorId,
      );
      return;
    }

    const mentorAccount =
      await LedgerService.getOrCreateUserAccount(mentorUserId);
    const platformAccount = await LedgerService.getOrCreatePlatformAccount();

    // 5. Create LedgerEntries
    // Platform commission
    await LedgerService.createEntry({
      paymentId: payment.id,
      accountId: platformAccount.id,
      amountCents: platformCommissionCents,
      status: LedgerStatus.PENDING,
    });

    // Mentor payout
    await LedgerService.createEntry({
      paymentId: payment.id,
      accountId: mentorAccount.id,
      amountCents: mentorPayoutCents,
      status: LedgerStatus.PENDING,
    });

    // Client referrer bonus
    if (
      clientReferralId &&
      clientReferrerUserId &&
      clientReferralBonusCents > 0
    ) {
      const clientReferrerUser =
        await UserService.getById(clientReferrerUserId);
      if (!clientReferrerUser) {
        Sentry.captureException(
          new Error(`Client referrer user not found: ${clientReferrerUserId}`),
          {
            tags: { service: "HandleCheckoutCompletedService" },
            extra: {
              sessionPackageId: sessionPackage.id,
              clientReferrerUserId,
            },
          },
        );
        await this.rejectPackageSafely(
          sessionPackage.id,
          sessionPackage.mentorId,
        );
        return;
      }

      const clientReferrerAccount =
        await LedgerService.getOrCreateUserAccount(clientReferrerUserId);

      await LedgerService.createEntry({
        paymentId: payment.id,
        accountId: clientReferrerAccount.id,
        amountCents: clientReferralBonusCents,
        status: LedgerStatus.PENDING,
      });

      await PaymentService.createPaymentReferral({
        paymentId: payment.id,
        referralId: clientReferralId,
        amountCents: clientReferralBonusCents,
      });
    }

    // Mentor referrer bonus
    if (
      mentorReferralId &&
      mentorReferrerUserId &&
      mentorReferralBonusCents > 0
    ) {
      const mentorReferrerUser =
        await UserService.getById(mentorReferrerUserId);
      if (!mentorReferrerUser) {
        Sentry.captureException(
          new Error(`Mentor referrer user not found: ${mentorReferrerUserId}`),
          {
            tags: { service: "HandleCheckoutCompletedService" },
            extra: {
              sessionPackageId: sessionPackage.id,
              mentorReferrerUserId,
            },
          },
        );
        await this.rejectPackageSafely(
          sessionPackage.id,
          sessionPackage.mentorId,
        );
        return;
      }

      const mentorReferrerAccount =
        await LedgerService.getOrCreateUserAccount(mentorReferrerUserId);

      await LedgerService.createEntry({
        paymentId: payment.id,
        accountId: mentorReferrerAccount.id,
        amountCents: mentorReferralBonusCents,
        status: LedgerStatus.PENDING,
      });

      await PaymentService.createPaymentReferral({
        paymentId: payment.id,
        referralId: mentorReferralId,
        amountCents: mentorReferralBonusCents,
      });
    }

    // 6. Send booking confirmation email
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
      // Don't throw — email failure should not break the payment flow
    }
  }

  /**
   * Safely reject a session package, logging any errors to Sentry.
   * This is a fallback when critical data is missing during payment processing.
   */
  private static async rejectPackageSafely(
    sessionPackageId: string,
    mentorUserId: string,
  ) {
    try {
      await RejectSessionPackageService.execute(
        sessionPackageId,
        mentorUserId,
        "Payment processing failed: missing required user data",
      );
      console.warn(
        `Rejected session package ${sessionPackageId} due to missing user data`,
      );
    } catch (rejectError) {
      Sentry.captureException(rejectError, {
        tags: {
          service: "HandleCheckoutCompletedService",
          action: "rejectFallback",
        },
        extra: { sessionPackageId, mentorUserId },
      });
      console.error(
        `Failed to reject session package ${sessionPackageId}:`,
        rejectError,
      );
    }
  }
}
