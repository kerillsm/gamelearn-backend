import { prisma } from "../../../lib/orm/prisma";

/**
 * Tracks release attempt number per group (groupKey = hash of split ids).
 * Increment only on Stripe error so retry uses a new idempotency key.
 * Delete after successful markSplitsAsPaid to keep table small.
 */
export class ReleasePaymentAttemptService {
  static async getAttemptNumber(groupKey: string): Promise<number> {
    const row = await prisma.releasePaymentAttempt.findUnique({
      where: { groupKey },
      select: { attemptNumber: true },
    });
    return row?.attemptNumber ?? 0;
  }

  static async incrementAttempt(groupKey: string): Promise<void> {
    await prisma.releasePaymentAttempt.upsert({
      where: { groupKey },
      create: { groupKey, attemptNumber: 1 },
      update: { attemptNumber: { increment: 1 } },
    });
  }

  static async deleteAttempt(groupKey: string): Promise<void> {
    await prisma.releasePaymentAttempt.deleteMany({
      where: { groupKey },
    });
  }
}
