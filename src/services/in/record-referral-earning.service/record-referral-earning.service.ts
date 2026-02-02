import { ReferralService } from "../../out/referral.service";
import { SessionService } from "../../out/session.service";

const REFERRER_BONUS_RATE = 0.05; // Flat 5% of total price

export class RecordReferralEarningService {
  static async execute(sessionId: string) {
    const session = await SessionService.getById(sessionId);
    if (!session) return null;

    const referralBonus = session.price * REFERRER_BONUS_RATE;

    if (referralBonus <= 0) return null;

    const earnings: Promise<unknown>[] = [];

    // Client referrer bonus (5% of total price, if referrer != mentor)
    const clientReferrerId = await ReferralService.getReferrerUserId(session.userId);
    if (clientReferrerId && clientReferrerId !== session.mentorUserId) {
      earnings.push(
        ReferralService.createEarning(clientReferrerId, sessionId, referralBonus, "CLIENT_REFERRAL"),
      );
    }

    // Mentor referrer bonus (5% of total price to whoever referred the mentor)
    const mentorReferrerId = await ReferralService.getReferrerUserId(session.mentorUserId);
    if (mentorReferrerId) {
      earnings.push(
        ReferralService.createEarning(mentorReferrerId, sessionId, referralBonus, "MENTOR_REFERRAL"),
      );
    }

    if (earnings.length === 0) return null;

    return Promise.all(earnings);
  }
}
