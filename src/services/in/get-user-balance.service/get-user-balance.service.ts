import {
  MentorProfileStatus,
  SplitRole,
  SplitStatus,
  UserRole,
} from "@prisma/client";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { PayoutService } from "../../out/payout.service";
import { PayoutSplitService } from "../../out/payout-split.service";
import { UserService } from "../../out/user.service";

const REFERRAL_ROLES: SplitRole[] = [
  SplitRole.STUDENT_REFERRER,
  SplitRole.MENTOR_REFERRER,
];

export interface GetUserBalanceResult {
  referralEarningsAvailable: number;
  referralEarningsPending: number;
  mentorEarningsAvailable?: number;
  mentorEarningsPending?: number;
  platformEarningsAvailable?: number;
  platformEarningsPending?: number;
  platformAvailableForWithdrawal?: number;
  /** Total amount (cents) paid out: platform for admin, connected account for others. */
  userPayedOut: number;
}

export class GetUserBalanceService {
  static async execute(userId: string): Promise<GetUserBalanceResult> {
    const user = await UserService.getById(userId);
    if (!user) {
      return {
        referralEarningsAvailable: 0,
        referralEarningsPending: 0,
        userPayedOut: 0,
      };
    }

    const userPayedOutPromise =
      user.role === UserRole.ADMIN
        ? PayoutService.getPlatformPayoutsSumCents()
        : PayoutService.getConnectedAccountPayoutsSumCents(userId);

    const [referralAvailable, referralPending, userPayedOut, mentorProfile] =
      await Promise.all([
        PayoutSplitService.getSumCentsByUserRolesAndStatus(
          userId,
          REFERRAL_ROLES,
          SplitStatus.PAID,
        ),
        PayoutSplitService.getSumCentsByUserRolesAndStatus(
          userId,
          REFERRAL_ROLES,
          SplitStatus.PENDING,
        ),
        userPayedOutPromise,
        MentorProfileService.getByUserId(userId, MentorProfileStatus.ACTIVE),
      ]);

    const result: GetUserBalanceResult = {
      referralEarningsAvailable: referralAvailable,
      referralEarningsPending: referralPending,
      userPayedOut,
    };

    if (mentorProfile) {
      const [mentorAvailable, mentorPending] = await Promise.all([
        PayoutSplitService.getSumCentsByUserRolesAndStatus(
          userId,
          [SplitRole.MENTOR],
          SplitStatus.PAID,
        ),
        PayoutSplitService.getSumCentsByUserRolesAndStatus(
          userId,
          [SplitRole.MENTOR],
          SplitStatus.PENDING,
        ),
      ]);
      result.mentorEarningsAvailable = mentorAvailable;
      result.mentorEarningsPending = mentorPending;
    }

    // Only send platform data for admin users.
    if (user.role === UserRole.ADMIN) {
      const [platformAvailable, platformPending] = await Promise.all([
        PayoutSplitService.getSumCentsByRoleAndStatus(
          SplitRole.PLATFORM,
          SplitStatus.PAID,
        ),
        PayoutSplitService.getSumCentsByRoleAndStatus(
          SplitRole.PLATFORM,
          SplitStatus.PENDING,
        ),
      ]);
      result.platformEarningsAvailable = platformAvailable;
      result.platformEarningsPending = platformPending;
      result.platformAvailableForWithdrawal = userPayedOut;
    }

    return result;
  }
}
