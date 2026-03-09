import { SplitRole, SplitStatus } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";
import { ReferralService } from "../../out/referral.service";
import type {
  EarningsSummaryDto,
  GetEarningsForUserParams,
} from "./earnings.service.interface";
import {
  centsToDollars,
  getPayoutSplitBalance,
  getPayoutSplitTotalByRoles,
  getEarningsWaitingSessionCompletion,
  getPlatformAvailableForWithdrawalCents,
} from "./utils";

export class EarningsService {
  /**
   * Returns the full earnings summary for the given user based on role and referrer status.
   * All amounts are in dollars. Uses PayoutSplit (no Ledger). isReferrer = user has a referral code.
   */
  static async getEarningsForUser(
    params: GetEarningsForUserParams,
  ): Promise<EarningsSummaryDto> {
    const { userId, userRole } = params;
    const isAdmin = userRole === "ADMIN";
    const isMentor = userRole === "MENTOR";
    const referralCode = await ReferralService.getCodeByUserId(userId);
    const isReferrer = !!referralCode;

    const result: EarningsSummaryDto = {
      totalReferralEarnings: 0,
      totalPaidOut: 0,
      isReferrer,
    };

    const totalPaidOutAgg = await prisma.payoutSplit.aggregate({
      where: { userId, status: SplitStatus.PAID },
      _sum: { amountCents: true },
    });
    result.totalPaidOut = centsToDollars(
      totalPaidOutAgg._sum?.amountCents ?? 0,
    );

    if (isMentor) {
      const mentor = await getPayoutSplitBalance(userId, [SplitRole.MENTOR]);
      result.mentorEarnings = centsToDollars(mentor.balanceCents);
      result.mentorEarningsAvailable = centsToDollars(mentor.availableCents);
      result.mentorEarningsOnHold = centsToDollars(mentor.onHoldCents);
      result.mentorEarningsWaitingSessionCompletion = centsToDollars(
        mentor.waitingSessionCompletionCents,
      );
    }

    if (isReferrer) {
      const referral = await getPayoutSplitBalance(userId, [
        SplitRole.MENTOR_REFERRER,
        SplitRole.STUDENT_REFERRER,
      ]);
      result.referralEarnings = centsToDollars(referral.balanceCents);
      result.referralEarningsAvailable = centsToDollars(referral.availableCents);
      result.referralEarningsOnHold = centsToDollars(referral.onHoldCents);
      result.referralEarningsWaitingSessionCompletion = centsToDollars(
        referral.waitingSessionCompletionCents,
      );
      result.totalReferralEarnings = result.referralEarnings;
    }

    if (isAdmin) {
      const [
        platform,
        totalMentor,
        totalReferral,
        stripeFee,
        waiting,
        platformAvailableCents,
      ] = await Promise.all([
        getPayoutSplitTotalByRoles([SplitRole.PLATFORM]),
        getPayoutSplitTotalByRoles([SplitRole.MENTOR]),
        getPayoutSplitTotalByRoles([
          SplitRole.MENTOR_REFERRER,
          SplitRole.STUDENT_REFERRER,
        ]),
        getPayoutSplitTotalByRoles([SplitRole.STRIPE_FEE]),
        getEarningsWaitingSessionCompletion(),
        getPlatformAvailableForWithdrawalCents(),
      ]);

      result.platformEarnings = centsToDollars(platform.balanceCents);
      result.platformEarningsAvailable = centsToDollars(platform.availableCents);
      result.platformEarningsOnHold = centsToDollars(platform.onHoldCents);
      result.platformEarningsWaitingSessionCompletion = centsToDollars(
        platform.waitingSessionCompletionCents,
      );
      result.totalMentorEarnings = centsToDollars(totalMentor.balanceCents);
      result.totalMentorEarningsAvailable = centsToDollars(
        totalMentor.availableCents,
      );
      result.totalMentorEarningsOnHold = centsToDollars(totalMentor.onHoldCents);
      result.totalMentorEarningsWaitingSessionCompletion = centsToDollars(
        totalMentor.waitingSessionCompletionCents,
      );
      result.allReferralEarnings = centsToDollars(totalReferral.balanceCents);
      result.allReferralEarningsAvailable = centsToDollars(
        totalReferral.availableCents,
      );
      result.allReferralEarningsOnHold = centsToDollars(
        totalReferral.onHoldCents,
      );
      result.allReferralEarningsWaitingSessionCompletion = centsToDollars(
        totalReferral.waitingSessionCompletionCents,
      );
      result.totalStripeFee = centsToDollars(stripeFee.balanceCents);
      result.totalStripeFeeAvailable = centsToDollars(stripeFee.availableCents);
      result.totalStripeFeeOnHold = centsToDollars(stripeFee.onHoldCents);
      result.totalStripeFeeWaitingSessionCompletion = centsToDollars(
        stripeFee.waitingSessionCompletionCents,
      );
      result.earningsWaitingSessionCompletion = centsToDollars(
        waiting.totalCents,
      );
      result.mentorEarningsWaitingCompletion = centsToDollars(
        waiting.mentorCents,
      );
      result.referralEarningsWaitingCompletion = centsToDollars(
        waiting.referralCents,
      );
      result.platformEarningsWaitingCompletion = centsToDollars(
        waiting.platformCents,
      );
      result.platformAvailableForWithdrawal = centsToDollars(
        platformAvailableCents,
      );
    }

    return result;
  }
}
