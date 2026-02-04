import { Prisma, SessionStatus, SessionType } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class SessionService {
  static getMentorSessions(
    mentorUserId: string,
    where?: Prisma.SessionWhereInput,
  ) {
    return prisma.session.findMany({
      where: {
        mentorUserId,
        ...where,
      },
    });
  }

  static createSession(data: Prisma.SessionCreateInput) {
    return prisma.session.create({
      data,
    });
  }

  static getVibeCheckSession(userId: string, mentorUserId: string) {
    return prisma.session.findFirst({
      where: {
        userId,
        mentorUserId,
        type: SessionType.VIBE_CHECK,
      },
    });
  }

  static deleteById(sessionId: string) {
    return prisma.session.delete({
      where: { id: sessionId },
    });
  }

  static updateStripeSessionId(sessionIds: string[], stripeSessionId: string) {
    return prisma.session.updateMany({
      where: { id: { in: sessionIds } },
      data: { stripeSessionId },
    });
  }

  static updateStatusByStripeSessionId(
    stripeSessionId: string,
    status: SessionStatus,
  ) {
    return prisma.session.updateMany({
      where: { stripeSessionId },
      data: { status },
    });
  }

  static updateByStripeSessionId(
    stripeSessionId: string,
    data: Prisma.SessionUpdateInput,
  ) {
    return prisma.session.updateMany({
      where: { stripeSessionId },
      data,
    });
  }

  static deleteByStripeSessionId(stripeSessionId: string) {
    return prisma.session.deleteMany({
      where: { stripeSessionId },
    });
  }

  static getByStripeSessionId(stripeSessionId: string) {
    return prisma.session.findMany({
      where: { stripeSessionId },
    });
  }

  static getById(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
    });
  }

  static updateSession(sessionId: string, data: Prisma.SessionUpdateInput) {
    return prisma.session.update({
      where: { id: sessionId },
      data,
    });
  }

  static countCompletedSessionsByMentor(mentorUserId: string) {
    return prisma.session.count({
      where: {
        mentorUserId,
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

  static async listSessions(
    filter: { userId?: string; mentorUserId?: string },
    options: { page: number; pageSize: number; status?: SessionStatus },
  ) {
    const { page, pageSize, status } = options;
    const where: Prisma.SessionWhereInput = {
      ...filter,
      ...(status && { status }),
    };

    const userSelect = { id: true, name: true, picture: true, slug: true };

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          user: { select: userSelect },
          mentorUser: { select: userSelect },
        },
        orderBy: { scheduledAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.session.count({ where }),
    ]);

    return { sessions, total };
  }
}
