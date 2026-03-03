import {
  PayoutSplit,
  SessionPackStatus,
  SplitRole,
  SplitStatus,
} from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

const DEFAULT_HOLD_HOURS_AFTER_LAST_SESSION = 48;

export class PayoutSplitService {
  /**
   * Finds PENDING PayoutSplits with userId set and role in the given list,
   * whose payment's session package is COMPLETED and lastSessionEndAt is at least
   * holdHoursAfterLastSession ago. Used by release-payment to pay only after sessions
   * are done and the hold period has passed.
   */
  static async findPendingSplitsEligibleForRelease(
    roles: SplitRole[],
    holdHoursAfterLastSession: number = DEFAULT_HOLD_HOURS_AFTER_LAST_SESSION,
  ): Promise<PayoutSplit[]> {
    const holdUntil = new Date(
      Date.now() - holdHoursAfterLastSession * 60 * 60 * 1000,
    );
    return prisma.payoutSplit.findMany({
      where: {
        status: SplitStatus.PENDING,
        userId: { not: null },
        role: { in: roles },
        payment: {
          sessionPackage: {
            status: SessionPackStatus.COMPLETED,
            lastSessionEndAt: { lte: holdUntil },
          },
        },
      },
    });
  }

  /**
   * Finds PENDING PayoutSplits with userId set and role in the given list.
   * No session/hold filter; use findPendingSplitsEligibleForRelease for release-payment.
   */
  static async findPendingSplitsByRoles(
    roles: SplitRole[],
  ): Promise<PayoutSplit[]> {
    return prisma.payoutSplit.findMany({
      where: {
        status: SplitStatus.PENDING,
        userId: { not: null },
        role: { in: roles },
      },
    });
  }

  /**
   * True if any PayoutSplit has this stripeTransferId (idempotency check).
   */
  static async hasSplitWithStripeTransferId(
    stripeTransferId: string,
  ): Promise<boolean> {
    const split = await prisma.payoutSplit.findFirst({
      where: { stripeTransferId },
      select: { id: true },
    });
    return split !== null;
  }

  /**
   * Marks the given splits as PAID and sets stripeTransferId.
   */
  static async markSplitsAsPaid(
    splitIds: string[],
    stripeTransferId: string,
    tx?: typeof prisma,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.payoutSplit.updateMany({
      where: { id: { in: splitIds } },
      data: { stripeTransferId, status: SplitStatus.PAID },
    });
  }
}
