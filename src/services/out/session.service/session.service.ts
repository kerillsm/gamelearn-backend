import { Prisma, SessionStatus } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class SessionService {
  static createSession(data: Prisma.SessionCreateInput) {
    return prisma.session.create({ data });
  }

  static getByStatusBefore(status: SessionStatus, date: Date) {
    return prisma.session.findMany({
      where: {
        status,
        scheduledAt: { lt: date },
      },
      select: {
        id: true,
        sessionPackageId: true,
        scheduledAt: true,
        duration: true,
      },
    });
  }

  static getById(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
    });
  }

  static getByIdWithPackage(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionPackage: {
          include: {
            mentor: {
              select: { id: true, name: true, picture: true, slug: true },
            },
            applicant: {
              select: { id: true, name: true, picture: true, slug: true },
            },
          },
        },
      },
    });
  }

  static updateSession(sessionId: string, data: Prisma.SessionUpdateInput) {
    return prisma.session.update({
      where: { id: sessionId },
      data,
    });
  }

  static updateMany(args: Prisma.SessionUpdateManyArgs) {
    return prisma.session.updateMany(args);
  }

  static deleteById(sessionId: string) {
    return prisma.session.delete({
      where: { id: sessionId },
    });
  }

  static deleteManyBySessionPackageId(sessionPackageId: string) {
    return prisma.session.deleteMany({
      where: { sessionPackageId },
    });
  }

  static findManyBySessionPackageId(sessionPackageId: string) {
    return prisma.session.findMany({
      where: { sessionPackageId },
      orderBy: { scheduledAt: "asc" },
    });
  }

  static countCompletedSessionsByMentor(mentorId: string) {
    return prisma.session.count({
      where: {
        sessionPackage: { mentorId },
        status: SessionStatus.COMPLETED,
      },
    });
  }

  static deletePendingByIds(sessionIds: string[]) {
    return prisma.session.deleteMany({
      where: {
        id: { in: sessionIds },
        status: SessionStatus.PENDING,
      },
    });
  }

  static getSessionsByMentorForDateRange(
    mentorId: string,
    start: Date,
    end: Date,
    statuses: SessionStatus[] = [
      SessionStatus.APPROVED,
      SessionStatus.COMPLETED,
    ],
  ) {
    return prisma.session.findMany({
      where: {
        sessionPackage: { mentorId },
        scheduledAt: { gte: start, lte: end },
        status: { in: statuses },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }
}
