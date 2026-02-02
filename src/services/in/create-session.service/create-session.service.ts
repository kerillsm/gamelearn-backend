import { HttpError } from "../../../lib/formatters/httpError";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { UserService } from "../../out/user.service";
import { CreateSessionDTO } from "./create-session.dto";
import { SESSION_DURATION_BY_TYPE, SessionService } from "../../out/session.service";
import { SessionStatus, SessionType } from "@prisma/client";
import { StripeService } from "../../out/stripe.service";
import { appConfig } from "../../../config/appConfig";
import { PricingService } from "../pricing.service";
import { SessionValidationService } from "../session-validation.service";
import { CreateSessionResult } from "./create-session.interface";
import { ReferralService } from "../../out/referral.service";

export class CreateSessionService {
  static async create(data: CreateSessionDTO): Promise<CreateSessionResult> {
    const user = await UserService.getById(data.userId);
    if (!user || !user.timezone) {
      throw new HttpError(400, "User not found or timezone not set");
    }

    const mentorProfile = await MentorProfileService.getBySlug(data.mentorSlug);
    if (!mentorProfile) {
      throw new HttpError(404, "Mentor profile not found");
    }

    // Get mentor's completed sessions count for dynamic fee calculation
    const mentorCompletedSessions = await SessionService.countCompletedSessionsByMentor(
      mentorProfile.userId,
    );

    // Get referrers for referral bonus calculation
    const clientReferrerId = await ReferralService.getReferrerUserId(user.id);
    const mentorReferrerId = await ReferralService.getReferrerUserId(mentorProfile.userId);

    const isFreeSession = PricingService.isFreeSession(data.sessionType);
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

    // Validate vibe check eligibility upfront
    if (data.sessionType === SessionType.VIBE_CHECK) {
      await SessionValidationService.validateVibeCheckEligibility(
        user.id,
        mentorProfile.userId,
      );
    }

    const createdSessionsIds: string[] = [];
    try {
      const sessions = await Promise.all(
        data.sessions.map(async (slot) => {
          const validatedSlot = await SessionValidationService.validateTimeSlot(
            user,
            mentorProfile.userId,
            data.sessionType,
            slot,
          );

          const sessionCreated = await SessionService.createSession({
            duration: SESSION_DURATION_BY_TYPE[data.sessionType],
            price: pricing.sessionPrice,
            scheduledAt: validatedSlot.scheduledAt,
            user: { connect: { id: user.id } },
            mentorUser: { connect: { id: mentorProfile.userId } },
            serviceFee: pricing.serviceFee,
            mentorEarnings: pricing.mentorEarnings / PricingService.getSessionsCount(data.sessionType),
            platformFee: pricing.platformFee / PricingService.getSessionsCount(data.sessionType),
            referralDiscount: pricing.referralDiscount / PricingService.getSessionsCount(data.sessionType),
            type: data.sessionType,
            status: isFreeSession ? SessionStatus.PAYED : SessionStatus.PENDING,
          });

          createdSessionsIds.push(sessionCreated.id);
          return sessionCreated;
        }),
      );

      if (isFreeSession) {
        return { sessions, checkoutUrl: null };
      }

      const checkoutSession = await StripeService.createCheckoutSession({
        sessionIds: createdSessionsIds,
        amount: Math.round(pricing.totalPrice * 100),
        mentorName: mentorProfile.name,
        sessionType: data.sessionType,
        successUrl: `${appConfig.frontendUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appConfig.frontendUrl}/booking/canceled?session_ids=${createdSessionsIds.join(",")}`,
      });

      await SessionService.updateStripeSessionId(
        createdSessionsIds,
        checkoutSession.id,
      );

      return { sessions, checkoutUrl: checkoutSession.url };
    } catch (error) {
      await Promise.all(
        createdSessionsIds.map((sessionId) =>
          SessionService.deleteById(sessionId),
        ),
      );
      throw error;
    }
  }
}
