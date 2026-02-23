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
    sessionPackageId: string,
    amount: number,
    type: ReferralEarningType = ReferralEarningType.CLIENT_REFERRAL,
  ) {
    return prisma.referralEarning.create({
      data: { referrerUserId, sessionPackageId, amount, type },
    });
  }

  static async getEarningsByUserId(userId: string) {
    return prisma.referralEarning.findMany({
      where: { referrerUserId: userId },
      include: { sessionPackage: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getEarningsBySessionPackageId(sessionPackageId: string) {
    return prisma.referralEarning.findMany({
      where: { sessionPackageId },
    });
  }

  static async markEarningPaidOut(earningId: string) {
    return prisma.referralEarning.update({
      where: { id: earningId },
      data: { isPaidOut: true },
    });
  }

  static async deleteUnpaidEarningsBySessionPackageId(sessionPackageId: string) {
    return prisma.referralEarning.deleteMany({
      where: {
        sessionPackageId,
        isPaidOut: false,
      },
    });
  }
}
