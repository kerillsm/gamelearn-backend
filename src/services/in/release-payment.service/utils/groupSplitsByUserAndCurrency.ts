import { PayoutSplit } from "@prisma/client";
import { ReleasableGroup } from "../types";

export function groupSplitsByUserAndCurrency(
  splits: PayoutSplit[],
): ReleasableGroup[] {
  const byKey = new Map<string, ReleasableGroup>();
  for (const s of splits) {
    if (s.userId == null) continue;
    const key = `${s.userId}:${s.currency}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.amountCents += s.amountCents;
      existing.splitIds.push(s.id);
    } else {
      byKey.set(key, {
        userId: s.userId,
        currency: s.currency,
        amountCents: s.amountCents,
        splitIds: [s.id],
        role: s.role,
      });
    }
  }
  return Array.from(byKey.values());
}
