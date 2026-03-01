import { LedgerDirection, SessionPackStatus } from "@prisma/client";
import { prisma } from "../../../../lib/orm/prisma";
import { LEDGER_ACCOUNT_CODES } from "../../../../types/ledger";

/**
 * Sum CREDIT entry amounts for given account codes, for transactions linked to payments
 * whose session package status is not COMPLETED.
 */
export async function getEarningsWaitingSessionCompletion(): Promise<{
  totalCents: number;
  mentorCents: number;
  referralCents: number;
  platformCents: number;
}> {
  const where = {
    direction: LedgerDirection.CREDIT,
    transaction: {
      payment: {
        sessionPackage: { status: { not: SessionPackStatus.COMPLETED } },
      },
    },
  };

  const [mentor, referral, platform] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { ...where, account: { code: LEDGER_ACCOUNT_CODES.MENTOR_PAYABLE } },
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { ...where, account: { code: LEDGER_ACCOUNT_CODES.REFERRAL_PAYABLE } },
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { ...where, account: { code: LEDGER_ACCOUNT_CODES.PLATFORM_COMMISSION } },
      _sum: { amountCents: true },
    }),
  ]);

  const mentorCents = mentor._sum?.amountCents ?? 0;
  const referralCents = referral._sum?.amountCents ?? 0;
  const platformCents = platform._sum?.amountCents ?? 0;

  return {
    totalCents: mentorCents + referralCents + platformCents,
    mentorCents,
    referralCents,
    platformCents,
  };
}
