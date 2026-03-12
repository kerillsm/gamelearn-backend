import { AgreementType } from "@prisma/client";
import { nanoid } from "nanoid";
import { HttpError } from "../../../lib/formatters/httpError";
import { AgreementService } from "../../out/agreement.service";
import { ReferralService } from "../../out/referral.service";

const CURRENT_REFERRAL_RULES_VERSION = "1.0";

interface GenerateReferralCodeOptions {
  acceptReferralRules?: boolean;
  ipAddress: string;
  userAgent?: string;
}

export class GenerateReferralCodeService {
  static async execute(userId: string, options?: GenerateReferralCodeOptions) {
    const hasAgreement = await AgreementService.getByUserIdAndType(
      userId,
      AgreementType.REFERRAL_PROGRAM_RULES,
    );

    if (!hasAgreement) {
      if (options?.acceptReferralRules === true) {
        // Create agreement record for referral program rules
        await AgreementService.create({
          user: {
            connect: {
              id: userId,
            },
          },
          type: AgreementType.REFERRAL_PROGRAM_RULES,
          version: CURRENT_REFERRAL_RULES_VERSION,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        });
      } else {
        throw new HttpError(
          403,
          "Accept referral program rules before generating a code",
        );
      }
    }

    const existing = await ReferralService.getCodeByUserId(userId);
    if (existing) {
      return existing;
    }

    const code = nanoid(8).toUpperCase();
    return ReferralService.createCode(userId, code);
  }
}
