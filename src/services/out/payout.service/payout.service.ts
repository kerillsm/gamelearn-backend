import { Payout, PayoutOwnerType, PayoutStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

interface UpdatePayoutStatusData {
  status: Payout["status"];
  arrivalDate?: Date | null;
  failureCode?: string | null;
  failureMessage?: string | null;
}

export class PayoutService {
  static async findUniqueByStripePayoutId(
    stripePayoutId: string,
  ): Promise<Payout | null> {
    return prisma.payout.findUnique({
      where: { stripePayoutId },
    });
  }

  static async updateStatus(
    id: string,
    data: UpdatePayoutStatusData,
  ): Promise<Payout> {
    return prisma.payout.update({
      where: { id },
      data: {
        status: data.status,
        arrivalDate: data.arrivalDate,
        failureCode: data.failureCode,
        failureMessage: data.failureMessage,
      },
    });
  }

  static async create(
    data: Prisma.PayoutUncheckedCreateInput,
  ): Promise<Payout> {
    return prisma.payout.create({ data });
  }

  /**
   * Sum of amountCents for platform payouts (status not FAILED/CANCELED).
   * Used for available-for-withdrawal calculation.
   */
  static async getPlatformPayoutsSumCents(): Promise<number> {
    const result = await prisma.payout.aggregate({
      where: {
        ownerType: PayoutOwnerType.PLATFORM,
        status: { notIn: [PayoutStatus.FAILED, PayoutStatus.CANCELED] },
      },
      _sum: { amountCents: true },
    });
    return result._sum?.amountCents ?? 0;
  }
}
