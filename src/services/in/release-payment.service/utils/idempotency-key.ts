import * as crypto from "node:crypto";

/**
 * Builds a stable idempotency key from split ids so the same set of splits
 * always yields the same key (safe retries after Stripe succeeds but DB fails).
 */
export function buildSplitGroupKey(splitIds: string[]): string {
  const payload = [...splitIds].sort().join(",");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Builds the key sent to Stripe: groupKey + attempt number.
 * When Stripe fails, we increment attempt so the next retry uses a new key and Stripe retries the operation.
 */
export function buildStripeIdempotencyKey(
  groupKey: string,
  attemptNumber: number,
): string {
  return `${groupKey}-${attemptNumber}`;
}
