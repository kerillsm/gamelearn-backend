import { SessionType } from "@prisma/client";
import { assertUnreachable } from "../../../lib/formatters/assertUnreachable";
import { PricingResult, ReferralContext } from "./pricing.interface";

const SESSIONS_IN_PACK_COUNT = 3;
const SESSIONS_PACK_DISCOUNT = 0.1;
const MENTOR_REFERRAL_DISCOUNT = 0.15; // Flat 15% reduction from fee
const REFERRER_BONUS_RATE = 0.05; // Flat 5% reduction from fee

// Service fee tiers based on mentor's completed sessions
const SERVICE_FEE_TIERS = [
  { minSessions: 150, fee: 0.25 }, // 25% after 150 sessions
  { minSessions: 50, fee: 0.28 },  // 28% after 50 sessions
  { minSessions: 0, fee: 0.33 },   // 33% default
];

export class PricingService {
  static calculate(
    sessionType: SessionType,
    mentorPrice: number,
    mentorCompletedSessions: number = 0,
    referralContext?: ReferralContext,
  ): PricingResult {
    let totalPrice: number;
    let sessionPrice: number;

    switch (sessionType) {
      case SessionType.VIBE_CHECK:
        totalPrice = 0;
        sessionPrice = 0;
        break;
      case SessionType.ONE_SESSION:
        totalPrice = mentorPrice;
        sessionPrice = mentorPrice;
        break;
      case SessionType.SESSIONS_PACK:
        totalPrice = mentorPrice * SESSIONS_IN_PACK_COUNT * (1 - SESSIONS_PACK_DISCOUNT);
        sessionPrice = totalPrice / SESSIONS_IN_PACK_COUNT;
        break;
      default:
        assertUnreachable(sessionType);
        totalPrice = 0;
        sessionPrice = 0;
    }

    let serviceFee = this.calculateServiceFee(mentorCompletedSessions);
    let referralDiscount = 0;
    let clientReferralBonus = 0;
    let mentorReferralBonus = 0;

    // Check if mentor referred the client (mentor gets 15% flat discount from fee)
    const mentorReferredClient =
      referralContext &&
      referralContext.clientReferrerId === referralContext.mentorUserId;

    if (mentorReferredClient) {
      // Flat 15% reduction: 33% - 15% = 18%
      referralDiscount = MENTOR_REFERRAL_DISCOUNT;
      serviceFee = Math.max(0, serviceFee - referralDiscount);
    }

    // Client referrer bonus: flat 5% of total price (fee reduced by 5%)
    if (
      referralContext?.clientReferrerId &&
      referralContext.clientReferrerId !== referralContext.mentorUserId
    ) {
      clientReferralBonus = totalPrice * REFERRER_BONUS_RATE;
      serviceFee = Math.max(0, serviceFee - REFERRER_BONUS_RATE);
    }

    // Mentor referrer bonus: flat 5% of total price (fee reduced by 5%)
    if (referralContext?.mentorReferrerId) {
      mentorReferralBonus = totalPrice * REFERRER_BONUS_RATE;
      serviceFee = Math.max(0, serviceFee - REFERRER_BONUS_RATE);
    }

    const serviceFeeAmount = totalPrice * serviceFee;
    const totalReferralBonuses = clientReferralBonus + mentorReferralBonus;
    const platformFeeAmount = serviceFeeAmount;
    const mentorEarnings = totalPrice - serviceFeeAmount - totalReferralBonuses;

    return {
      totalPrice,
      sessionPrice,
      serviceFee,
      mentorEarnings,
      platformFee: platformFeeAmount,
      clientReferralBonus,
      mentorReferralBonus,
      referralDiscount,
    };
  }

  static calculateServiceFee(completedSessions: number): number {
    for (const tier of SERVICE_FEE_TIERS) {
      if (completedSessions >= tier.minSessions) {
        return tier.fee;
      }
    }
    return SERVICE_FEE_TIERS[SERVICE_FEE_TIERS.length - 1].fee;
  }

  static isFreeSession(sessionType: SessionType): boolean {
    return sessionType === SessionType.VIBE_CHECK;
  }

  static getSessionsCount(sessionType: SessionType): number {
    return sessionType === SessionType.SESSIONS_PACK ? SESSIONS_IN_PACK_COUNT : 1;
  }
}
