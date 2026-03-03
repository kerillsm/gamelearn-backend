import * as Sentry from "@sentry/node";
import Stripe from "stripe";
import {
  MentorProfileStatus,
  PaymentStatus,
  PayoutSplit,
  SessionPackStatus,
  SessionStatus,
  SplitRole,
  SplitStatus,
} from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";
import { SessionPackageService } from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import { PaymentService } from "../../out/payment.service";
import { PaymentProcessingLockService } from "../../out/payment-processing-lock.service";
import { UserService } from "../../out/user.service";
import { ReferralService } from "../../out/referral.service";
import { StripeService } from "../../out/stripe.service";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { PricingService } from "../pricing.service";
import { RejectSessionPackageService } from "../reject-session-package.service";
import {
  EmailService,
  buildApplicantBookingConfirmationEmail,
} from "../../out/email.service";

/** Referral bonus percent used in PricingService (for PaymentReferral snapshot). */
const REFERRER_BONUS_PERCENT = 5;

const LOCK_KIND = "CHECKOUT_COMPLETED";

export class HandleCheckoutCompletedService {
  /**
   * Processes a completed Stripe Checkout session: idempotency, Payment and PayoutSplits creation,
   * PaymentReferral snapshot, then package/session status and email. No payout execution here
   * (release-payment job pays PENDING splits to mentors and referrers via Stripe Connect).
   */
  static async execute(
    checkoutSession: Stripe.Checkout.Session,
    stripeEventId: string,
  ) {
    const stripeSessionPackageId = checkoutSession.id;
    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : (checkoutSession.payment_intent?.id ?? "");

    if (!paymentIntentId) {
      console.warn(
        "Checkout session completed without payment_intent:",
        stripeSessionPackageId,
      );
      return;
    }

    // 1) Idempotency: do not double-process the same Stripe event
    const acquired = await PaymentProcessingLockService.tryAcquire(
      stripeEventId,
      paymentIntentId,
      LOCK_KIND,
    );
    if (!acquired) {
      console.log(
        `Checkout already processed for event ${stripeEventId}, skipping.`,
      );
      return;
    }

    // 2) Load domain objects: SessionPackage by checkout session id
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

    // Double-guard: if Payment already exists and SUCCEEDED, skip (e.g. duplicate webhook)
    const existingPayment =
      await PaymentService.getByStripePaymentIntentId(paymentIntentId);
    if (existingPayment && existingPayment.status === PaymentStatus.SUCCEEDED) {
      console.log(
        `Payment already SUCCEEDED for intent ${paymentIntentId}, skipping.`,
      );
      return;
    }

    // 3) Stripe: fetch fee and net from balance transaction
    const paymentIntent = await StripeService.getPaymentIntent(paymentIntentId);
    const charge =
      await StripeService.getChargeFromPaymentIntent(paymentIntent);
    let stripeFeeCents = 0;
    let netAmountCents: number | null = null;
    if (charge) {
      const { feeCents, netCents } =
        await StripeService.getBalanceTransactionFeeAndNet(charge);
      stripeFeeCents = feeCents;
      netAmountCents = netCents;
    }

    const grossAmountCents = checkoutSession.amount_total ?? 0;
    const currency = checkoutSession.currency ?? "usd";

    // Commission and referral from PricingService (same logic as at booking)
    const mentorProfile = await MentorProfileService.getByUserId(
      sessionPackage.mentorId,
      MentorProfileStatus.ACTIVE,
    );
    if (!mentorProfile) {
      Sentry.captureException(
        new Error(`Mentor profile not found: ${sessionPackage.mentorId}`),
        {
          tags: { service: "HandleCheckoutCompletedService" },
          extra: {
            sessionPackageId: sessionPackage.id,
            mentorId: sessionPackage.mentorId,
          },
        },
      );
      await this.rejectPackageSafely(
        sessionPackage.id,
        sessionPackage.mentorId,
      );
      return;
    }

    const mentorCompletedSessions =
      await SessionService.countCompletedSessionsByMentor(
        sessionPackage.mentorId,
      );
    const clientReferrerId = await ReferralService.getReferrerUserId(
      sessionPackage.applicantId,
    );
    const mentorReferrerId = await ReferralService.getReferrerUserId(
      sessionPackage.mentorId,
    );
    const pricing = PricingService.calculate(
      sessionPackage.type,
      mentorProfile.price,
      mentorCompletedSessions,
      {
        clientReferrerId,
        mentorReferrerId,
        mentorUserId: sessionPackage.mentorId,
      },
    );

    const platformCommissionCents = Math.round(pricing.platformFee * 100);
    const clientReferralBonusCents = Math.round(
      pricing.clientReferralBonus * 100,
    );
    const mentorReferralBonusCents = Math.round(
      pricing.mentorReferralBonus * 100,
    );
    const totalReferralCents =
      clientReferralBonusCents + mentorReferralBonusCents;
    const mentorPayoutCents =
      grossAmountCents -
      platformCommissionCents -
      clientReferralBonusCents -
      mentorReferralBonusCents;

    const clientReferral = await ReferralService.getReferralByReferredUserId(
      sessionPackage.applicantId,
    );
    const mentorReferral = await ReferralService.getReferralByReferredUserId(
      sessionPackage.mentorId,
    );

    const mentorUser = await UserService.getById(sessionPackage.mentorId);
    if (!mentorUser) {
      Sentry.captureException(
        new Error(`Mentor user not found: ${sessionPackage.mentorId}`),
        {
          tags: { service: "HandleCheckoutCompletedService" },
          extra: {
            sessionPackageId: sessionPackage.id,
            mentorId: sessionPackage.mentorId,
          },
        },
      );
      await this.rejectPackageSafely(
        sessionPackage.id,
        sessionPackage.mentorId,
      );
      return;
    }

    if (clientReferralBonusCents > 0 && clientReferrerId) {
      const refUser = await UserService.getById(clientReferrerId);
      if (!refUser) {
        Sentry.captureException(
          new Error(`Client referrer user not found: ${clientReferrerId}`),
          {
            tags: { service: "HandleCheckoutCompletedService" },
            extra: { sessionPackageId: sessionPackage.id, clientReferrerId },
          },
        );
        await this.rejectPackageSafely(
          sessionPackage.id,
          sessionPackage.mentorId,
        );
        return;
      }
    }
    if (mentorReferralBonusCents > 0 && mentorReferrerId) {
      const refUser = await UserService.getById(mentorReferrerId);
      if (!refUser) {
        Sentry.captureException(
          new Error(`Mentor referrer user not found: ${mentorReferrerId}`),
          {
            tags: { service: "HandleCheckoutCompletedService" },
            extra: { sessionPackageId: sessionPackage.id, mentorReferrerId },
          },
        );
        await this.rejectPackageSafely(
          sessionPackage.id,
          sessionPackage.mentorId,
        );
        return;
      }
    }

    // 4) Single Prisma transaction: Payment, PayoutSplits, PaymentReferrals, package/session updates
    await prisma.$transaction(async (tx) => {
      const payment = await PaymentService.create(
        {
          sessionPackageId: sessionPackage.id,
          stripePaymentIntentId: paymentIntentId,
          stripeCheckoutSessionId: stripeSessionPackageId,
          grossAmountCents,
          currency,
          stripeFeeCents,
          netAmountCents,
          status: PaymentStatus.SUCCEEDED,
        },
        tx as typeof prisma,
      );

      // PaymentReferral snapshot per referrer (from PricingService)
      if (clientReferralBonusCents > 0 && clientReferral && clientReferrerId) {
        await PaymentService.createPaymentReferral(
          {
            paymentId: payment.id,
            referralId: clientReferral.id,
            amountCents: clientReferralBonusCents,
            percent: REFERRER_BONUS_PERCENT,
          },
          tx as typeof prisma,
        );
      }
      if (mentorReferralBonusCents > 0 && mentorReferral && mentorReferrerId) {
        await PaymentService.createPaymentReferral(
          {
            paymentId: payment.id,
            referralId: mentorReferral.id,
            amountCents: mentorReferralBonusCents,
            percent: REFERRER_BONUS_PERCENT,
          },
          tx as typeof prisma,
        );
      }

      // PayoutSplits: one per slice (release-payment will pay MENTOR, MENTOR_REFERRER, STUDENT_REFERRER via Stripe Connect)
      const payoutSplitsData: Omit<PayoutSplit, "id" | "stripeTransferId">[] = [
        {
          paymentId: payment.id,
          userId: sessionPackage.mentorId,
          role: SplitRole.MENTOR,
          amountCents: mentorPayoutCents,
          currency,
          status: SplitStatus.PENDING,
        },
        {
          paymentId: payment.id,
          userId: null,
          role: SplitRole.PLATFORM,
          amountCents: platformCommissionCents,
          currency,
          status: SplitStatus.PENDING,
        },
        {
          paymentId: payment.id,
          userId: null,
          role: SplitRole.STRIPE_FEE,
          amountCents: stripeFeeCents,
          currency,
          status: SplitStatus.PAID,
        },
      ];
      if (clientReferralBonusCents > 0 && clientReferrerId) {
        payoutSplitsData.push({
          paymentId: payment.id,
          userId: clientReferrerId,
          role: SplitRole.STUDENT_REFERRER,
          amountCents: clientReferralBonusCents,
          currency,
          status: SplitStatus.PENDING,
        });
      }
      if (mentorReferralBonusCents > 0 && mentorReferrerId) {
        payoutSplitsData.push({
          paymentId: payment.id,
          userId: mentorReferrerId,
          role: SplitRole.MENTOR_REFERRER,
          amountCents: mentorReferralBonusCents,
          currency,
          status: SplitStatus.PENDING,
        });
      }
      await tx.payoutSplit.createMany({ data: payoutSplitsData });

      // Update package and sessions status
      await tx.sessionPackage.updateMany({
        where: { stripeSessionPackageId },
        data: {
          status: SessionPackStatus.PAYED,
          stripePaymentIntentId: paymentIntentId,
        },
      });
      for (const session of sessionPackage.sessions) {
        await tx.session.update({
          where: { id: session.id },
          data: { status: SessionStatus.PAYED },
        });
      }
    });

    console.log(
      `Payment completed for package ${sessionPackage.id}, stripeSessionPackageId: ${stripeSessionPackageId}`,
    );

    // 5) Email (outside transaction; failure should not roll back payment)
    try {
      const pkg = await SessionPackageService.getByStripeSessionPackageId(
        stripeSessionPackageId,
      );
      if (pkg) {
        await EmailService.sendEmail(
          buildApplicantBookingConfirmationEmail({
            applicant: pkg.applicant,
            mentor: pkg.mentor,
            sessions: pkg.sessions,
            sessionPackage: pkg,
          }),
        );
        console.log(
          `Booking confirmation email sent to ${pkg.applicant.email}`,
        );
      }
    } catch (error) {
      console.error("Failed to send booking confirmation email:", error);
    }
  }

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
