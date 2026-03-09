import { SplitRole, SplitStatus } from "@prisma/client";
import { prisma } from "../../../../lib/orm/prisma";
import { PayoutService } from "../../../out/payout.service";

/**
 * Platform available for withdrawal (cents):
 * PAID (PLATFORM splits) - sum(Payout for PLATFORM, status not FAILED/CANCELED).
 * PENDING splits are not available for withdrawal.
 */
export async function getPlatformAvailableForWithdrawalCents(): Promise<number> {
  const [paidSum, payoutCents] = await Promise.all([
    prisma.payoutSplit.aggregate({
      where: { role: SplitRole.PLATFORM, status: SplitStatus.PAID },
      _sum: { amountCents: true },
    }),
    PayoutService.getPlatformPayoutsSumCents(),
  ]);

  const paidCents = paidSum._sum?.amountCents ?? 0;
  return Math.max(0, paidCents - payoutCents);
}
