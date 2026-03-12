import { PayoutSplitService } from "../../out/payout-split.service";
import {
  GetIncomesHistoryResult,
  IncomeHistoryItem,
} from "./get-incomes-history.interface";

const DEFAULT_PAGE_SIZE = 10;
const HOLD_HOURS_AFTER_LAST_SESSION = 48;

export class GetIncomesHistoryService {
  static async execute(
    userId: string,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    includePlatformIncomes = false,
  ): Promise<GetIncomesHistoryResult> {
    const { splits, total } = await PayoutSplitService.listByUserIdPaginated(
      userId,
      page,
      pageSize,
      includePlatformIncomes,
    );

    const incomes: IncomeHistoryItem[] = splits.map((split) => {
      const lastSessionEndAt = split.payment.sessionPackage.lastSessionEndAt;
      let availableHoldUntil: string | null = null;
      if (lastSessionEndAt) {
        const holdUntil = new Date(lastSessionEndAt);
        holdUntil.setHours(
          holdUntil.getHours() + HOLD_HOURS_AFTER_LAST_SESSION,
        );
        availableHoldUntil = holdUntil.toISOString();
      }

      return {
        id: split.id,
        amountCents: split.amountCents,
        currency: split.currency,
        status: split.status,
        role: split.role,
        sessionPackageId: split.payment.sessionPackageId,
        availableHoldUntil,
      };
    });

    return {
      incomes,
      total,
      page,
      pageSize,
    };
  }
}
