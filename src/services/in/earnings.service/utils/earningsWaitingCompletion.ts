import { SessionPackStatus, SplitRole } from "@prisma/client";
import { prisma } from "../../../../lib/orm/prisma";

/**
 * Sum PayoutSplit amounts for splits whose session package status is not COMPLETED,
 * broken down by mentor / referral / platform (for admin dashboard).
 */
export async function getEarningsWaitingSessionCompletion(): Promise<{
  totalCents: number;
  mentorCents: number;
  referralCents: number;
  platformCents: number;
}> {
  const whereIncomplete = {
    payment: {
      sessionPackage: { status: { not: SessionPackStatus.COMPLETED } },
    },
  };

  const [mentor, referral, platform] = await Promise.all([
    prisma.payoutSplit.aggregate({
      where: { ...whereIncomplete, role: SplitRole.MENTOR },
      _sum: { amountCents: true },
    }),
    prisma.payoutSplit.aggregate({
      where: {
        ...whereIncomplete,
        role: { in: [SplitRole.MENTOR_REFERRER, SplitRole.STUDENT_REFERRER] },
      },
      _sum: { amountCents: true },
    }),
    prisma.payoutSplit.aggregate({
      where: { ...whereIncomplete, role: SplitRole.PLATFORM },
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
