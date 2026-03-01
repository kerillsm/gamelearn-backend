import type { LedgerDirection } from "@prisma/client";

/** Input for one line of a balanced ledger transaction. */
export interface LedgerEntryInput {
  accountId: string;
  amountCents: number;
  direction: LedgerDirection;
  /** Optional: for liability entries, when the amount becomes payable (e.g. after package completion + 2 days). */
  holdUntil?: Date | null;
}

/** Standard ledger account codes (chart of accounts). */
export const LEDGER_ACCOUNT_CODES = {
  STRIPE_CLEARING: "STRIPE_CLEARING",
  PLATFORM_COMMISSION: "PLATFORM_COMMISSION",
  STRIPE_FEE: "STRIPE_FEE",
  REFERRAL_COMMISSION: "REFERRAL_COMMISSION",
  MENTOR_PAYABLE: "MENTOR_PAYABLE",
  REFERRAL_PAYABLE: "REFERRAL_PAYABLE",
} as const;
