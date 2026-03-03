import * as crypto from "node:crypto";

/**
 * Builds a stable idempotency key from split ids so the same set of splits
 * always yields the same key (safe retries after Stripe succeeds but DB fails).
 */
export function buildIdempotencyKey(splitIds: string[]): string {
  const payload = [...splitIds].sort().join(",");
  return crypto.createHash("sha256").update(payload).digest("hex");
}
