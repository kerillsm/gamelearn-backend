import { HttpError } from "../../../lib/formatters/httpError";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { UserService } from "../../out/user.service";
import { CreateSessionPackageDTO } from "./create-session-package.dto";
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
import { CreateSessionPackageResult } from "./create-session-package.interface";
import { ReferralService } from "../../out/referral.service";

export class CreateSessionPackageService {
  static async create(
    data: CreateSessionPackageDTO,
  ): Promise<CreateSessionPackageResult> {
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
    if (!isFreeSession) {
      if (mentorUser.stripeConnectStatus !== StripeConnectStatus.ACTIVE) {
        throw new HttpError(
          400,
          "This mentor is not yet available for booking. Please try again later.",
        );
      }
      if (!mentorUser.stripeConnectAccountId) {
        throw new HttpError(
          400,
          "This mentor is not yet available for booking. Please try again later.",
        );
      }
    }

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

    let sessionPackage = await SessionPackageService.create({
      type: data.sessionType,
      status: isFreeSession
        ? SessionPackStatus.PAYED
        : SessionPackStatus.PENDING,
      duration,
      price: pricing.totalPrice,
      mentor: { connect: { id: mentorProfile.userId } },
      applicant: { connect: { id: user.id } },
    });

    try {
      await Promise.all(
        data.sessions.map(async (slot) => {
          const validatedSlot = await SessionValidationService.validateTimeSlot(
            user,
            mentorProfile.userId,
            data.sessionType,
            slot,
          );

          return SessionService.createSession({
            sessionPackage: { connect: { id: sessionPackage.id } },
            scheduledAt: validatedSlot.scheduledAt,
            duration,
            serviceFee: pricing.serviceFee / sessionsCount,
            mentorEarnings: pricing.mentorEarnings / sessionsCount,
            platformFee: pricing.platformFee / sessionsCount,
            referralDiscount: pricing.referralDiscount / sessionsCount,
            status: isFreeSession ? SessionStatus.PAYED : SessionStatus.PENDING,
          });
        }),
      );
    } catch (error) {
      await SessionPackageService.deleteById(sessionPackage.id);
      throw error;
    }

    if (isFreeSession) {
      // sessionPackage with sessions
      sessionPackage = (await SessionPackageService.getById(
        sessionPackage.id,
      )) as SessionPackage & { sessions: Session[] };
      if (!sessionPackage) {
        throw new HttpError(500, "Session package not found");
      }
      return { sessionPackage, checkoutUrl: null };
    }

    const checkoutSession = await StripeService.createCheckoutSession({
      sessionPackageId: sessionPackage.id,
      amount: Math.round(pricing.totalPrice * 100),
      mentorName: mentorProfile.name,
      sessionType: data.sessionType,
      successUrl: `${appConfig.frontendUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appConfig.frontendUrl}/booking/canceled?session_package_id=${sessionPackage.id}`,
    });

    await SessionPackageService.updateStripeSessionPackageId(
      sessionPackage.id,
      checkoutSession.id,
    );

    sessionPackage = (await SessionPackageService.getById(
      sessionPackage.id,
    )) as SessionPackage & { sessions: Session[] };

    return {
      sessionPackage,
      checkoutUrl: checkoutSession.url,
    };
  }
}
