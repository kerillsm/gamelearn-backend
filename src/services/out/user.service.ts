import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/orm/prisma";

export class UserService {
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
}
