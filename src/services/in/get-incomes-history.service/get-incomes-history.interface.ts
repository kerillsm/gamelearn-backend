export interface IncomeHistoryItem {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  role: string;
  sessionPackageId: string;
  availableHoldUntil: string | null;
}

export interface GetIncomesHistoryResult {
  incomes: IncomeHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}
