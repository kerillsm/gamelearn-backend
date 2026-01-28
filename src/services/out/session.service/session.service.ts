import { prisma } from "../../../lib/orm/prisma";

export class SessionService {
  static getMentorSessions(
    mentorUserId: string,
    scheduledAt?: { gte?: Date; lte?: Date },
  ) {
    return prisma.session.findMany({
      where: {
        mentorUserId,
        scheduledAt,
      },
    });
  }
}
