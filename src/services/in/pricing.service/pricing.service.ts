import { SessionType } from "@prisma/client";
import { assertUnreachable } from "../../../lib/formatters/assertUnreachable";
import { PricingResult } from "./pricing.interface";

const SESSIONS_IN_PACK_COUNT = 3;
const SESSIONS_PACK_DISCOUNT = 0.1;

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

    const serviceFee = this.calculateServiceFee(mentorCompletedSessions);

    return {
      totalPrice,
      sessionPrice,
      serviceFee,
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
