import { prisma } from "../../../lib/orm/prisma";

/**
 * Idempotency for Stripe webhook processing: ensures we do not double-process
 * the same Stripe event or the same PaymentIntent/Checkout Session.
 */
export class PaymentProcessingLockService {
  /**
   * Tries to acquire a lock for the given Stripe event.
   * @returns true if lock was acquired (first time processing), false if already processed (skip).
   */
  static async tryAcquire(
    stripeEventId: string,
    stripeObjectId: string,
    kind: string,
  ): Promise<boolean> {
    try {
      await prisma.paymentProcessingLock.create({
        data: {
          stripeEventId,
          stripeObjectId,
          kind,
        },
      });
      return true;
    } catch (e: unknown) {
      // Unique constraint on stripeEventId -> already processed
      const isUniqueViolation =
        e &&
        typeof e === "object" &&
        "code" in e &&
        (e as { code: string }).code === "P2002";
      if (isUniqueViolation) {
        return false;
      }
      throw e;
    }
  }
}
