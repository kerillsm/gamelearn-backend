import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../lib/orm/prisma";

export class UserService {
  static countUsers(role?: UserRole) {
    return prisma.user.count({
      where: role ? { role } : {},
    });
  }

  static countUsersCreatedSince(since: Date) {
    return prisma.user.count({
      where: { createdAt: { gte: since } },
    });
  }

  static getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        mentorProfiles: true,
      },
    });
  }

  static getByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        authAccounts: true,
      },
    });
  }

  static getByStripeConnectAccountId(accountId: string) {
    return prisma.user.findFirst({
      where: { stripeConnectAccountId: accountId },
    });
  }

  static getByEmailVerificationToken(token: string) {
    return prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });
  }

  static async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  }

  static async updateUser(userId: string, profileData: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id: userId },
      data: profileData,
    });
  }

  static async deleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
