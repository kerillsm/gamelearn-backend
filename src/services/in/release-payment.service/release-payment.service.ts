import { LedgerStatus, SessionPackStatus } from "@prisma/client";
import { LedgerService } from "../../out/ledger.service";
import { SessionPackageService } from "../../out/sessionPackage.service";

const RELEASE_AFTER_HOURS = 48;

type ReleasePaymentResult = {
  packagesProcessed: number;
  paymentIds: string[];
  releasedCount: number;
};

export class ReleasePaymentService {
  static async execute(): Promise<ReleasePaymentResult> {
    console.log("Running release payment service...");
    // Release when 48h have passed since last session: (lastSessionEndAt + 48h) <= now  =>  lastSessionEndAt <= now - 48h
    const now = Date.now();
    const releaseEarliestAt = new Date(
      now - RELEASE_AFTER_HOURS * 60 * 60 * 1000,
    );

    const packages = await SessionPackageService.getAll(
      {
        status: SessionPackStatus.COMPLETED,
        lastSessionEndAt: { lte: releaseEarliestAt },
        payment: {
          ledgerEntries: {
            some: {
              status: LedgerStatus.PENDING,
            },
          },
        },
      },
      { payment: { select: { id: true } } },
    );

    const paymentIds = packages
      .map((pkg) => pkg.payment?.id)
      .filter((id): id is string => id != null);

    if (paymentIds.length === 0) {
      console.log(
        `Release payment: no completed packages with pending ledger entries that are older than ${RELEASE_AFTER_HOURS}h.`,
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
