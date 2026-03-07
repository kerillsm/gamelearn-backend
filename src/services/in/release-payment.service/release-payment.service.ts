import { SplitRole } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";
import { PayoutSplitService } from "../../out/payout-split.service";
import { ReleasePaymentAttemptService } from "../../out/release-payment-attempt.service";
import { StripeService } from "../../out/stripe.service";
import { UserService } from "../../out/user.service";
import type { ReleasePaymentResult } from "./types";
import {
  buildSplitGroupKey,
  buildStripeIdempotencyKey,
} from "./utils/idempotency-key";
import { groupSplitsByUserAndCurrency } from "./utils/groupSplitsByUserAndCurrency";

const PAYEE_ROLES = [
  SplitRole.MENTOR,
  SplitRole.MENTOR_REFERRER,
  SplitRole.STUDENT_REFERRER,
] as const;

/** Only release payments for completed session packages, 48h after last session end. */
const HOLD_HOURS_AFTER_LAST_SESSION = 48;

/**
 * Releases payable funds to Mentors and Referrers. Only considers PayoutSplits whose
 * session package is COMPLETED and lastSessionEndAt was at least 48 hours ago. Groups
 * by (userId, currency), creates Stripe Connect transfers, then marks splits as PAID.
 * Idempotent via key from split ids.
 */
export class ReleasePaymentService {
  static async execute(): Promise<ReleasePaymentResult> {
    console.log("release payment service started");
    const result: ReleasePaymentResult = {
      groupsProcessed: 0,
      payoutsCreated: 0,
      skippedNoConnect: 0,
      errors: [],
    };

    const splits = await PayoutSplitService.findPendingSplitsEligibleForRelease(
      [...PAYEE_ROLES],
      HOLD_HOURS_AFTER_LAST_SESSION,
    );
    const groups = groupSplitsByUserAndCurrency(splits);
    if (groups.length === 0) return result;

    for (const group of groups) {
      result.groupsProcessed += 1;

      const connectAccountId =
        (await UserService.getById(group.userId))?.stripeConnectAccountId ??
        null;

      if (!connectAccountId) {
        result.skippedNoConnect += 1;
        result.errors.push(
          `ReleasePayment: no Stripe Connect account for user ${group.userId} (${group.role}, ${group.amountCents} cents); skipping.`,
        );
        continue;
      }

      const groupKey = buildSplitGroupKey(group.splitIds);
      const attemptNumber =
        await ReleasePaymentAttemptService.getAttemptNumber(groupKey);
      const stripeIdempotencyKey = buildStripeIdempotencyKey(
        groupKey,
        attemptNumber,
      );
      let stripeTransferId: string;

      try {
        const transfer = await StripeService.createTransfer(
          connectAccountId,
          group.amountCents,
          {
            payoutType: group.role,
            userId: group.userId,
          },
          { currency: group.currency, idempotencyKey: stripeIdempotencyKey },
        );
        stripeTransferId = transfer.id;
      } catch (err) {
        console.log("err", err);
        await ReleasePaymentAttemptService.incrementAttempt(groupKey);
        const message = err instanceof Error ? err.message : String(err);
        result.errors.push(
          `ReleasePayment: Stripe transfer failed for user ${group.userId} (${group.role}): ${message}`,
        );
        continue;
      }

      if (
        await PayoutSplitService.hasSplitWithStripeTransferId(stripeTransferId)
      )
        continue;

      try {
        await prisma.$transaction(async (tx) => {
          await PayoutSplitService.markSplitsAsPaid(
            group.splitIds,
            stripeTransferId,
            tx as typeof prisma,
          );
        });
        await ReleasePaymentAttemptService.deleteAttempt(groupKey);
        result.payoutsCreated += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result.errors.push(
          `ReleasePayment: DB transaction failed after Stripe transfer ${stripeTransferId} for user ${group.userId}: ${message}. Retry will reuse same transfer via idempotency key.`,
        );
      }
    }

    console.log("result of release payment service", result);

    return result;
  }
}
