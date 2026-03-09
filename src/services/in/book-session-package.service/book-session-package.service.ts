import { HttpError } from "../../../lib/formatters/httpError";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { UserService } from "../../out/user.service";
import { BookSessionPackageDTO } from "./book-session-package.dto";
import {
  SessionPackageService,
  SESSION_PACKAGE_DURATION_BY_TYPE,
} from "../../out/sessionPackage.service";
import { SessionService } from "../../out/session.service";
import {
  Session,
  SessionPackStatus,
  SessionPackage,
  SessionPackageType,
  SessionStatus,
  StripeConnectStatus,
} from "@prisma/client";
import { StripeService } from "../../out/stripe.service";
import { appConfig } from "../../../config/appConfig";
import { PricingService } from "../pricing.service";
import { SessionValidationService } from "../session-validation.service";
import { BookSessionPackageResult } from "./book-session-package.interface";
import { ReferralService } from "../../out/referral.service";

/** Payment and PayoutSplits are created on checkout completion (handle-checkout-completed), not here. */
export class BookSessionPackageService {
  static async execute(
    data: BookSessionPackageDTO,
  ): Promise<BookSessionPackageResult> {
    const user = await UserService.getById(data.userId);
    if (!user || !user.timezone) {
      throw new HttpError(400, "User not found or timezone not set");
    }

    const mentorProfile = await MentorProfileService.getBySlug(data.mentorSlug);
    if (!mentorProfile) {
      throw new HttpError(404, "Mentor profile not found");
    }

    const mentorUser = await UserService.getById(mentorProfile.userId);
    if (!mentorUser) {
      throw new HttpError(404, "Mentor not found");
    }

    const isFreeSession = PricingService.isFreeSession(data.sessionType);

    const mentorCompletedSessions =
      await SessionService.countCompletedSessionsByMentor(mentorProfile.userId);
    const clientReferrerId = await ReferralService.getReferrerUserId(user.id);
    const mentorReferrerId = await ReferralService.getReferrerUserId(
      mentorProfile.userId,
    );

    const pricing = PricingService.calculate(
      data.sessionType,
      mentorProfile.price,
      mentorCompletedSessions,
      {
        clientReferrerId,
        mentorReferrerId,
        mentorUserId: mentorProfile.userId,
      },
    );

    if (data.sessionType === SessionPackageType.VIBE_CHECK) {
      await SessionValidationService.validateVibeCheckEligibility(
        user.id,
        mentorProfile.userId,
      );
    }

    const sessionsCount = PricingService.getSessionsCount(data.sessionType);
    const duration = SESSION_PACKAGE_DURATION_BY_TYPE[data.sessionType];

    if (data.sessions.length !== sessionsCount) {
      throw new HttpError(
        400,
        `Invalid number of sessions. Expected ${sessionsCount} for session type ${data.sessionType}.`,
      );
    }

    const validatedSlots = await Promise.all(
      data.sessions.map((slot) =>
        SessionValidationService.validateTimeSlot(
          user,
          mentorProfile.userId,
          data.sessionType,
          slot,
        ),
      ),
    );

    const firstSessionStartAt = validatedSlots.reduce(
      (min, slot) => (slot.scheduledAt < min ? slot.scheduledAt : min),
      validatedSlots[0].scheduledAt,
    );
    const lastSessionEndAt = validatedSlots.reduce(
      (max, slot) => {
        const endAt = new Date(
          slot.scheduledAt.getTime() + duration * 60 * 1000,
        );
        return endAt > max ? endAt : max;
      },
      new Date(validatedSlots[0].scheduledAt.getTime() + duration * 60 * 1000),
    );

    let sessionPackage = await SessionPackageService.create({
      type: data.sessionType,
      status: isFreeSession
        ? SessionPackStatus.PAYED
        : SessionPackStatus.PENDING,
      duration,
      price: pricing.totalPrice,
      mentor: { connect: { id: mentorProfile.userId } },
      applicant: { connect: { id: user.id } },
      firstSessionStartAt,
      lastSessionEndAt,
    });

    try {
      await Promise.all(
        validatedSlots.map((validatedSlot) =>
          SessionService.createSession({
            sessionPackage: { connect: { id: sessionPackage.id } },
            scheduledAt: validatedSlot.scheduledAt,
            duration,
            status: isFreeSession ? SessionStatus.PAYED : SessionStatus.PENDING,
          }),
        ),
      );
    } catch (error) {
      await SessionPackageService.deleteById(sessionPackage.id);
      throw error;
    }

    if (isFreeSession) {
      sessionPackage = (await SessionPackageService.getById(
        sessionPackage.id,
      )) as SessionPackage & { sessions: Session[] };
      if (!sessionPackage) {
        throw new HttpError(500, "Session package not found");
      }
      return { sessionPackage, checkoutUrl: null };
    }

    // Compute cent amounts for Stripe metadata
    const totalAmountCents = Math.round(pricing.totalPrice * 100);
    const platformCommissionPct = Math.round(pricing.serviceFee * 100); // e.g. 33 for 33%
    const platformCommissionCents = Math.round(pricing.platformFee * 100);
    const mentorPayoutCents = Math.round(pricing.mentorEarnings * 100);
    const clientReferralBonusCents = Math.round(
      pricing.clientReferralBonus * 100,
    );
    const mentorReferralBonusCents = Math.round(
      pricing.mentorReferralBonus * 100,
    );

    // Get full Referral records for PaymentReferral linking
    const clientReferral = clientReferrerId
      ? await ReferralService.getReferralByReferredUserId(user.id)
      : null;
    const mentorReferral = mentorReferrerId
      ? await ReferralService.getReferralByReferredUserId(mentorProfile.userId)
      : null;

    const checkoutSession = await StripeService.createCheckoutSession({
      sessionPackageId: sessionPackage.id,
      amount: totalAmountCents,
      mentorName: mentorProfile.name,
      sessionType: data.sessionType,
      successUrl: `${appConfig.frontendUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appConfig.frontendUrl}/booking/canceled?session_package_id=${sessionPackage.id}`,
      mentorUserId: mentorProfile.userId,
      platformCommissionPct,
      platformCommissionCents,
      mentorPayoutCents,
      clientReferralBonusCents,
      mentorReferralBonusCents,
      clientReferralId: clientReferral?.id ?? null,
      mentorReferralId: mentorReferral?.id ?? null,
      clientReferrerUserId: clientReferrerId,
      mentorReferrerUserId: mentorReferrerId,
    });

    sessionPackage = await SessionPackageService.updateStripeSessionPackageId(
      sessionPackage.id,
      checkoutSession.id,
    );

    return {
      sessionPackage,
      checkoutUrl: checkoutSession.url,
    };
  }
}
