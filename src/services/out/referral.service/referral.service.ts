import { ReferralEarningType } from "@prisma/client";
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

  static async createEarning(
    referrerUserId: string,
    sessionId: string,
    amount: number,
    type: ReferralEarningType = ReferralEarningType.CLIENT_REFERRAL,
  ) {
    return prisma.referralEarning.create({
      data: { referrerUserId, sessionId, amount, type },
    });
  }

  static async getEarningsByUserId(userId: string) {
    return prisma.referralEarning.findMany({
      where: { referrerUserId: userId },
      include: { session: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
