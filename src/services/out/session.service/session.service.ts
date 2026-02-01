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
}
