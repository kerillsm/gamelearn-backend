import { MentorApplicationStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

const userSelect = {
  id: true,
  name: true,
  email: true,
  slug: true,
  role: true,
} as const;

export class MentorApplicationService {
  static createApplication(data: Prisma.MentorApplicationCreateInput) {
    return prisma.mentorApplication.create({
      data,
    });
  }

  static getById(id: string) {
    return prisma.mentorApplication.findUnique({
      where: { id },
      include: { user: { select: userSelect } },
    });
  }

  static getApplicationList(
    take: number,
    skip: number,
    status?: Prisma.EnumMentorApplicationStatusFilter,
  ) {
    const where = status ? { status } : {};
    return prisma.mentorApplication.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: { user: { select: userSelect } },
    });
  }

  static countApplications(status?: Prisma.EnumMentorApplicationStatusFilter) {
    const where = status ? { status } : {};
    return prisma.mentorApplication.count({ where });
  }

  static updateStatus(
    id: string,
    status: MentorApplicationStatus,
    rejectionReason?: string,
  ) {
    return prisma.mentorApplication.update({
      where: { id },
      data: {
        status,
        ...(rejectionReason != null && { rejectionReason }),
      },
    });
  }
}
