import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/orm/prisma";

export class UserService {
  static getByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        authAccounts: true,
      },
    });
  }

  static async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  }
}
