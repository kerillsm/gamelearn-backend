import { ReferralService } from "../../out/referral.service";

export class ApplyReferralCodeService {
  static async execute(userId: string, code: string) {
    const existingReferral = await ReferralService.getReferralByUserId(userId);
    if (existingReferral) {
      return { applied: false, reason: "User already has a referrer" };
    }

    const referralCode = await ReferralService.getCodeByCode(code);
    if (!referralCode) {
      return { applied: false, reason: "Invalid referral code" };
    }

    if (referralCode.userId === userId) {
      return { applied: false, reason: "Cannot use own referral code" };
    }

    await ReferralService.createReferral(referralCode.id, userId);
    return { applied: true, referrerName: referralCode.user.name };
  }
}
