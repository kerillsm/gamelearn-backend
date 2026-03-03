import { SessionPackStatus, SplitRole, SplitStatus } from "@prisma/client";
import { prisma } from "../../../../lib/orm/prisma";

export interface PayoutSplitBalance {
  balanceCents: number;
  onHoldCents: number;
  /** Amount from splits whose session package is not COMPLETED. */
  waitingSessionCompletionCents: number;
  /** PENDING amount (not yet paid out). */
  availableCents: number;
}

/**
 * Get balance and breakdown for a user's PayoutSplits by role(s).
 * balanceCents = sum(amountCents). availableCents = sum where status PENDING.
 * onHoldCents = 0 (no hold in PayoutSplit model). waitingSessionCompletionCents = sum where session package not COMPLETED.
 */
export async function getPayoutSplitBalance(
  userId: string,
  roles: SplitRole[],
): Promise<PayoutSplitBalance> {
  const [total, pending, waiting] = await Promise.all([
    prisma.payoutSplit.aggregate({
      where: { userId, role: { in: roles } },
      _sum: { amountCents: true },
    }),
    prisma.payoutSplit.aggregate({
      where: { userId, role: { in: roles }, status: SplitStatus.PENDING },
      _sum: { amountCents: true },
    }),
    prisma.payoutSplit.aggregate({
      where: {
        userId,
        role: { in: roles },
        payment: {
          sessionPackage: { status: { not: SessionPackStatus.COMPLETED } },
        },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const balanceCents = total._sum?.amountCents ?? 0;
  const availableCents = pending._sum?.amountCents ?? 0;
  const waitingSessionCompletionCents = waiting._sum?.amountCents ?? 0;

  return {
    balanceCents,
    onHoldCents: 0,
    waitingSessionCompletionCents,
    availableCents,
  };
}

/**
 * Get total balance across all PayoutSplits with the given role(s) (any userId).
 * Used for admin totals.
 */
export async function getPayoutSplitTotalByRoles(
  roles: SplitRole[],
): Promise<PayoutSplitBalance> {
  const [total, pending, waiting] = await Promise.all([
    prisma.payoutSplit.aggregate({
      where: { role: { in: roles } },
      _sum: { amountCents: true },
    }),
    prisma.payoutSplit.aggregate({
      where: { role: { in: roles }, status: SplitStatus.PENDING },
      _sum: { amountCents: true },
    }),
    prisma.payoutSplit.aggregate({
      where: {
        role: { in: roles },
        payment: {
          sessionPackage: { status: { not: SessionPackStatus.COMPLETED } },
        },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const balanceCents = total._sum?.amountCents ?? 0;
  const availableCents = pending._sum?.amountCents ?? 0;
  const waitingSessionCompletionCents = waiting._sum?.amountCents ?? 0;

  return {
    balanceCents,
    onHoldCents: 0,
    waitingSessionCompletionCents,
    availableCents,
  };
}
