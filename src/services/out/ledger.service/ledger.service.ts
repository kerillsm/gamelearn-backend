import { LedgerAccountType, LedgerStatus } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class LedgerService {
  static async getOrCreateUserAccount(userId: string) {
    const existing = await prisma.ledgerAccount.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    return prisma.ledgerAccount.create({
      data: { userId, type: LedgerAccountType.USER },
    });
  }

  static async getOrCreatePlatformAccount() {
    const existing = await prisma.ledgerAccount.findFirst({
      where: { type: LedgerAccountType.PLATFORM, userId: null },
    });
    if (existing) return existing;

    return prisma.ledgerAccount.create({
      data: { type: LedgerAccountType.PLATFORM },
    });
  }

  static async createEntry(data: {
    paymentId: string;
    accountId: string;
    amountCents: number;
    status: LedgerStatus;
  }) {
    return prisma.ledgerEntry.create({ data });
  }
}
