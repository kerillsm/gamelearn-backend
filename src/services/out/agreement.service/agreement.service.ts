import { AgreementType, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class AgreementService {
  static async createMany(data: Prisma.AgreementCreateManyInput[]) {
    return prisma.agreement.createMany({
      data,
    });
  }

  static async create(data: Prisma.AgreementCreateInput) {
    return prisma.agreement.create({
      data,
    });
  }

  static async getByUserId(userId: string) {
    return prisma.agreement.findMany({
      where: { userId },
      orderBy: { acceptedAt: "desc" },
    });
  }

  static async getByUserIdAndType(userId: string, type: AgreementType) {
    return prisma.agreement.findFirst({
      where: { userId, type },
      orderBy: { acceptedAt: "desc" },
    });
  }
}
