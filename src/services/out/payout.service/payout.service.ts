import { PayoutStatus, PayoutType } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class PayoutService {
  static async create(data: {
    userId: string;
    amount: number;
    type: PayoutType;
    sessionId?: string;
    referralEarningId?: string;
  }) {
    return prisma.payout.create({ data });
  }

  static async updateStatus(
    id: string,
    status: PayoutStatus,
    stripeTransferId?: string,
    failureReason?: string,
  ) {
    return prisma.payout.update({
      where: { id },
      data: {
        status,
        stripeTransferId,
        failureReason,
        processedAt: status === PayoutStatus.COMPLETED ? new Date() : undefined,
      },
    });
  }

  static async getCompletedBySessionId(sessionId: string) {
    return prisma.payout.findFirst({
      where: {
        sessionId,
        type: PayoutType.SESSION_EARNING,
        status: PayoutStatus.COMPLETED,
      },
    });
  }

  static async getCompletedByReferralEarningId(referralEarningId: string) {
    return prisma.payout.findFirst({
      where: {
        referralEarningId,
        type: PayoutType.REFERRAL_BONUS,
        status: PayoutStatus.COMPLETED,
      },
    });
  }

  static async getByUserId(userId: string) {
    return prisma.payout.findMany({
      where: { userId },
      include: { session: true, referralEarning: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Referral-only earnings summary (used for withdraw with destination charges)
  static async getReferralEarningsSummary(userId: string) {
    const [referralEarnings, unpaidReferralEarnings, referralPayouts] =
      await Promise.all([
        prisma.referralEarning.aggregate({
          where: { referrerUserId: userId },
          _sum: { amount: true },
        }),
        prisma.referralEarning.aggregate({
          where: { referrerUserId: userId, isPaidOut: false },
          _sum: { amount: true },
        }),
        prisma.payout.aggregate({
          where: {
            userId,
            type: PayoutType.REFERRAL_BONUS,
            status: PayoutStatus.COMPLETED,
          },
          _sum: { amount: true },
        }),
      ]);

    const totalEarnings = referralEarnings._sum.amount ?? 0;
    const totalPaidOut = referralPayouts._sum.amount ?? 0;
    const availableToWithdraw = unpaidReferralEarnings._sum.amount ?? 0;

    return {
      totalEarnings,
      totalPaidOut,
      availableToWithdraw,
    };
  }
}
