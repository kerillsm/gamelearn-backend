import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class MentorApplicationService {
  static createApplication(data: Prisma.MentorApplicationCreateInput) {
    return prisma.mentorApplication.create({
      data,
    });
  }

  static getApplicationList(
    take: number,
    skip: number,
    status?: Prisma.EnumMentorApplicationStatusFilter,
  ) {
    return prisma.mentorApplication.findMany({
      take,
      skip,
      where: {
        status,
      },
    });
  }
}
