import {
  LedgerDirection,
  LedgerTransactionType,
} from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";
import type { LedgerEntryInput } from "../../../types/ledger";

type PrismaClientLike = typeof prisma;

/**
 * Creates a balanced ledger transaction (sum of debits = sum of credits).
 * Used for PAYMENT_CAPTURE, STRIPE_FEE, REFERRAL_COMMISSION.
 * Pass `tx` when running inside a Prisma transaction for atomicity.
 */
export class LedgerService {
  /**
   * Creates one LedgerTransaction and its LedgerEntry rows.
   * @throws if entries are not balanced (sum DEBIT !== sum CREDIT).
   */
  static async createBalancedTransaction(
    paymentId: string | null,
    type: LedgerTransactionType,
    entries: LedgerEntryInput[],
    _externalRef?: string | null,
    tx?: PrismaClientLike,
  ) {
    const client = tx ?? prisma;
    const debits = entries
      .filter((e) => e.direction === LedgerDirection.DEBIT)
      .reduce((s, e) => s + e.amountCents, 0);
    const credits = entries
      .filter((e) => e.direction === LedgerDirection.CREDIT)
      .reduce((s, e) => s + e.amountCents, 0);
    if (debits !== credits) {
      throw new Error(
        `Ledger transaction not balanced: debits=${debits} credits=${credits} type=${type}`,
      );
    }

    const ledgerTx = await client.ledgerTransaction.create({
      data: {
        paymentId,
        type,
      },
    });

    await client.ledgerEntry.createMany({
      data: entries.map((e) => ({
        transactionId: ledgerTx.id,
        accountId: e.accountId,
        amountCents: e.amountCents,
        direction: e.direction,
        holdUntil: e.holdUntil ?? undefined,
      })),
    });

    return ledgerTx;
  }

  /**
   * No-op for backward compatibility with ReleasePaymentService.
   * New ledger model uses holdUntil on entries; actual payout release is handled elsewhere.
   */
  static async releasePendingEntriesForPayments(
    _paymentIds: string[],
  ): Promise<{ count: number }> {
    return { count: 0 };
  }
}
