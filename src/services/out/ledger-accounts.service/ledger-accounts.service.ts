import { LedgerAccountCategory } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

type PrismaClientLike = typeof prisma;

/**
 * Chart-of-accounts: get or create ledger accounts by code (and optional userId for liability accounts).
 * Safe under concurrency: uses unique constraint (code, userId) and create + catch duplicate.
 * Pass `tx` when running inside a Prisma transaction for atomicity.
 */
export class LedgerAccountsService {
  static async getOrCreateAccount(
    code: string,
    category: LedgerAccountCategory,
    name: string,
    userId?: string | null,
    tx?: PrismaClientLike,
  ) {
    const client = tx ?? prisma;
    const existing = await client.ledgerAccount.findFirst({
      where: { code, userId: userId ?? null },
    });
    if (existing) return existing;

    try {
      return await client.ledgerAccount.create({
        data: { code, category, name, userId: userId ?? undefined },
      });
    } catch (e: unknown) {
      const isUniqueViolation =
        e &&
        typeof e === "object" &&
        "code" in e &&
        (e as { code: string }).code === "P2002";
      if (isUniqueViolation) {
        const again = await client.ledgerAccount.findFirst({
          where: { code, userId: userId ?? null },
        });
        if (again) return again;
      }
      throw e;
    }
  }
}
