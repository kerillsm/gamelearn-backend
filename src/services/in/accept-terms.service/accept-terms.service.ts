import { AgreementType } from "@prisma/client";
import { AgreementService } from "../../out/agreement.service";
import { UserService } from "../../out/user.service";

const CURRENT_TERMS_VERSION = "1.0";
const CURRENT_PRIVACY_VERSION = "1.0";

export interface AcceptTermsInput {
  userId: string;
  ipAddress: string;
  userAgent?: string;
}

export class AcceptTermsService {
  static async execute(input: AcceptTermsInput) {
    const { userId, ipAddress, userAgent } = input;
    const now = new Date();

    // Create agreement records for both terms and privacy
    await AgreementService.createMany([
      {
        userId,
        type: AgreementType.TERMS_OF_SERVICE,
        version: CURRENT_TERMS_VERSION,
        ipAddress,
        userAgent,
        acceptedAt: now,
      },
      {
        userId,
        type: AgreementType.PRIVACY_POLICY,
        version: CURRENT_PRIVACY_VERSION,
        ipAddress,
        userAgent,
        acceptedAt: now,
      },
    ]);

    // Update user's termsAcceptedAt for quick access checks
    const user = await UserService.updateUser(userId, { termsAcceptedAt: now });
    return { id: user.id, termsAcceptedAt: user.termsAcceptedAt };
  }
}
