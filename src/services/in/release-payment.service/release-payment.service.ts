import { SessionPackStatus } from "@prisma/client";
import { LedgerService } from "../../out/ledger.service";
import { SessionPackageService } from "../../out/sessionPackage.service";

const RELEASE_AFTER_HOURS = 48;

type ReleasePaymentResult = {
  packagesProcessed: number;
  paymentIds: string[];
  releasedCount: number;
};

/**
 * Finds completed packages past the release window that have a payment with ledger transactions.
 * Actual payout execution (creating Payout records, Stripe transfers) is handled elsewhere;
 * this service is kept for compatibility and can be extended to set holdUntil or trigger payouts.
 */
export class ReleasePaymentService {
  static async execute(): Promise<ReleasePaymentResult> {
    console.log("Running release payment service...");
    const now = Date.now();
    const releaseEarliestAt = new Date(
      now - RELEASE_AFTER_HOURS * 60 * 60 * 1000,
    );

    const packages = await SessionPackageService.getAll(
      {
        status: SessionPackStatus.COMPLETED,
        lastSessionEndAt: { lte: releaseEarliestAt },
        payment: { isNot: null },
      },
      { payment: { select: { id: true } } },
    );

    const paymentIds = packages
      .map((pkg) => pkg.payment?.id)
      .filter((id): id is string => id != null);

    if (paymentIds.length === 0) {
      console.log(
        `Release payment: no completed packages with payments older than ${RELEASE_AFTER_HOURS}h.`,
      );
      return {
        packagesProcessed: 0,
        paymentIds: [],
        releasedCount: 0,
      };
    }

    const { count: releasedCount } =
      await LedgerService.releasePendingEntriesForPayments(paymentIds);

    console.log(
      `Release payment: ${packages.length} packages, ${releasedCount} ledger entries released.`,
    );

    return {
      packagesProcessed: packages.length,
      paymentIds,
      releasedCount,
    };
  }
}
