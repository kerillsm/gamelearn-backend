import { prisma } from "../../../lib/orm/prisma";

export class ReferralService {
  static async getCodeByUserId(userId: string) {
    return prisma.referralCode.findUnique({
      where: { userId },
    });
  }

  static async getCodeByCode(code: string) {
    return prisma.referralCode.findUnique({
      where: { code },
      include: { user: true },
    });
  }

  static async createCode(userId: string, code: string) {
    return prisma.referralCode.create({
      data: { userId, code },
    });
  }

  static async getReferralByUserId(userId: string) {
    return prisma.referral.findUnique({
      where: { referredUserId: userId },
      include: {
        referralCode: {
          include: { user: true },
        },
      },
    });
  }

  static async createReferral(referralCodeId: string, referredUserId: string) {
    return prisma.referral.create({
      data: { referralCodeId, referredUserId },
    });
  }

  static async getReferrerUserId(userId: string): Promise<string | null> {
    const referral = await prisma.referral.findUnique({
      where: { referredUserId: userId },
      include: {
        referralCode: true,
      },
    });
    return referral?.referralCode.userId ?? null;
  }

  /**
   * Returns the full Referral record for a referred user (needed for PaymentReferral.referralId).
   */
  static async getReferralByReferredUserId(userId: string) {
    return prisma.referral.findUnique({
      where: { referredUserId: userId },
    });
  }
}
