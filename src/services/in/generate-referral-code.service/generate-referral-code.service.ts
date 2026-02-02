import { nanoid } from "nanoid";
import { ReferralService } from "../../out/referral.service";

export class GenerateReferralCodeService {
  static async execute(userId: string) {
    const existing = await ReferralService.getCodeByUserId(userId);
    if (existing) {
      return existing;
    }

    const code = nanoid(8).toUpperCase();
    return ReferralService.createCode(userId, code);
  }
}
