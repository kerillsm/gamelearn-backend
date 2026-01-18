import { prisma } from "../../../lib/orm/prisma";

export class AuthService {
  static getAuthAccountByProviderAndAccountId(
    provider: string,
    providerAccountId: string,
  ) {
    return prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: true,
      },
    });
  }

  static async createAuthAccount(
    userId: string,
    provider: string,
    providerAccountId: string,
  ) {
    return prisma.authAccount.create({
      data: {
        user: {
          connect: { id: userId },
        },
        provider,
        providerAccountId,
      },
    });
  }
}
