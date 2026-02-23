import { ReferralService } from "../../out/referral.service";
import { SessionPackageService } from "../../out/sessionPackage.service";

const REFERRER_BONUS_RATE = 0.05;

export class RecordReferralEarningService {
  static async execute(sessionPackageId: string) {
    const sessionPackage = await SessionPackageService.getById(sessionPackageId);
    if (!sessionPackage) return null;

    const referralBonus = sessionPackage.price * REFERRER_BONUS_RATE;
    if (referralBonus <= 0) return null;

    const earnings: Promise<unknown>[] = [];

    const clientReferrerId = await ReferralService.getReferrerUserId(
      sessionPackage.applicantId,
    );
    if (
      clientReferrerId &&
      clientReferrerId !== sessionPackage.mentorId
    ) {
      earnings.push(
        ReferralService.createEarning(
          clientReferrerId,
          sessionPackageId,
          referralBonus,
          "CLIENT_REFERRAL",
        ),
      );
    }

    const mentorReferrerId = await ReferralService.getReferrerUserId(
      sessionPackage.mentorId,
    );
    if (mentorReferrerId) {
      earnings.push(
        ReferralService.createEarning(
          mentorReferrerId,
          sessionPackageId,
          referralBonus,
          "MENTOR_REFERRAL",
        ),
      );
    }

    if (earnings.length === 0) return null;

    return Promise.all(earnings);
  }
}
