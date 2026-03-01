import type { UserRole } from "@prisma/client";

/** Earnings summary returned by the earnings service (amounts in dollars). */
export interface EarningsSummaryDto {
  totalReferralEarnings: number;
  totalPaidOut: number;
  isReferrer?: boolean;

  /** Mentor: total balance. */
  mentorEarnings?: number;
  /** Mentor: amount that can be paid out. */
  mentorEarningsAvailable?: number;
  mentorEarningsOnHold?: number;
  mentorEarningsWaitingSessionCompletion?: number;

  referralEarnings?: number;
  referralEarningsAvailable?: number;
  referralEarningsOnHold?: number;
  referralEarningsWaitingSessionCompletion?: number;

  platformEarnings?: number;
  platformEarningsAvailable?: number;
  platformEarningsOnHold?: number;
  platformEarningsWaitingSessionCompletion?: number;

  totalMentorEarnings?: number;
  totalMentorEarningsAvailable?: number;
  totalMentorEarningsOnHold?: number;
  totalMentorEarningsWaitingSessionCompletion?: number;

  /** Platform-wide sum across all REFERRAL_PAYABLE (admin only). */
  allReferralEarnings?: number;
  allReferralEarningsAvailable?: number;
  allReferralEarningsOnHold?: number;
  allReferralEarningsWaitingSessionCompletion?: number;

  totalStripeFee?: number;
  totalStripeFeeAvailable?: number;
  totalStripeFeeOnHold?: number;
  totalStripeFeeWaitingSessionCompletion?: number;

  /** Admin: total earnings waiting for session completion (mentor + referral + platform). */
  earningsWaitingSessionCompletion?: number;
  mentorEarningsWaitingCompletion?: number;
  referralEarningsWaitingCompletion?: number;
  platformEarningsWaitingCompletion?: number;
}

export interface GetEarningsForUserParams {
  userId: string;
  userRole: UserRole;
}
