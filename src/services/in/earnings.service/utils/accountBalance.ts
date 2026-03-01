import {
  LedgerAccountCategory,
  LedgerDirection,
  SessionPackStatus,
} from "@prisma/client";
import { prisma } from "../../../../lib/orm/prisma";

export interface AccountBalance {
  balanceCents: number;
  onHoldCents: number;
  /** CREDIT amount from payments whose session package is not COMPLETED. */
  waitingSessionCompletionCents: number;
  /** Balance that can be paid out: total minus on-hold minus waiting for session completion. */
  availableCents: number;
}

/**
 * Get balance and breakdown for a ledger account by code and optional userId.
 * Liability/Revenue: balance = sum(CREDIT) - sum(DEBIT). Expense: balance = sum(DEBIT) - sum(CREDIT).
 * On-hold = sum of CREDIT amounts where holdUntil > now.
 * Waiting session completion = CREDIT amounts from transactions linked to payments whose session package is not COMPLETED.
 * Available = balance - onHold - waitingSessionCompletion (amount that can be paid out).
 */
export async function getAccountBalance(
  code: string,
  category: LedgerAccountCategory,
  userId?: string | null,
): Promise<AccountBalance> {
  const account = await prisma.ledgerAccount.findFirst({
    where: { code, userId: userId ?? null },
  });
  if (!account) {
    return {
      balanceCents: 0,
      onHoldCents: 0,
      waitingSessionCompletionCents: 0,
      availableCents: 0,
    };
  }

  const now = new Date();
  const [creditSum, debitSum, onHoldSum, waitingSessionSum] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { accountId: account.id, direction: LedgerDirection.CREDIT },
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { accountId: account.id, direction: LedgerDirection.DEBIT },
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        accountId: account.id,
        direction: LedgerDirection.CREDIT,
        holdUntil: { not: null, gt: now },
      },
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        accountId: account.id,
        direction: LedgerDirection.CREDIT,
        transaction: {
          payment: {
            sessionPackage: { status: { not: SessionPackStatus.COMPLETED } },
          },
        },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const credits = creditSum._sum?.amountCents ?? 0;
  const debits = debitSum._sum?.amountCents ?? 0;
  const onHoldCents = onHoldSum._sum?.amountCents ?? 0;
  const waitingSessionCompletionCents =
    waitingSessionSum._sum?.amountCents ?? 0;

  const balanceCents =
    category === LedgerAccountCategory.EXPENSE ? debits - credits : credits - debits;

  const availableCents = Math.max(
    0,
    balanceCents - onHoldCents - waitingSessionCompletionCents,
  );

  return {
    balanceCents,
    onHoldCents,
    waitingSessionCompletionCents,
    availableCents,
  };
}

/**
 * Get total balance and breakdown across all accounts with the given code (e.g. all MENTOR_PAYABLE).
 */
export async function getTotalBalanceByCode(
  code: string,
  category: LedgerAccountCategory,
): Promise<AccountBalance> {
  const accounts = await prisma.ledgerAccount.findMany({
    where: { code },
    select: { id: true },
  });
  if (accounts.length === 0) {
    return {
      balanceCents: 0,
      onHoldCents: 0,
      waitingSessionCompletionCents: 0,
      availableCents: 0,
    };
  }

  const accountIds = accounts.map((a) => a.id);
  const now = new Date();

  const [creditSum, debitSum, onHoldSum, waitingSessionSum] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: {
        accountId: { in: accountIds },
        direction: LedgerDirection.CREDIT,
      },
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        accountId: { in: accountIds },
        direction: LedgerDirection.DEBIT,
      },
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        accountId: { in: accountIds },
        direction: LedgerDirection.CREDIT,
        holdUntil: { not: null, gt: now },
      },
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        accountId: { in: accountIds },
        direction: LedgerDirection.CREDIT,
        transaction: {
          payment: {
            sessionPackage: { status: { not: SessionPackStatus.COMPLETED } },
          },
        },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const credits = creditSum._sum?.amountCents ?? 0;
  const debits = debitSum._sum?.amountCents ?? 0;
  const onHoldCents = onHoldSum._sum?.amountCents ?? 0;
  const waitingSessionCompletionCents =
    waitingSessionSum._sum?.amountCents ?? 0;
  const balanceCents =
    category === LedgerAccountCategory.EXPENSE ? debits - credits : credits - debits;

  const availableCents = Math.max(
    0,
    balanceCents - onHoldCents - waitingSessionCompletionCents,
  );

  return {
    balanceCents,
    onHoldCents,
    waitingSessionCompletionCents,
    availableCents,
  };
}
