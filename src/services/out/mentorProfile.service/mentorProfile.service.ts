import { MentorProfileStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class MentorProfileService {
  static async getBySlug(
    slug: string,
    status: MentorProfileStatus = MentorProfileStatus.ACTIVE,
  ) {
    // Use findFirst instead of findUnique because slug is unique only in User model
    return prisma.mentorProfile.findFirst({
      where: { user: { slug }, status },
      include: { user: { select: { slug: true } } },
    });
  }

  static async getByUserId(userId: string, status: MentorProfileStatus) {
    return prisma.mentorProfile.findUnique({
      where: {
        userId_status: {
          userId,
          status,
        },
      },
    });
  }

  static async remove(mentorProfileId: string) {
    return prisma.mentorProfile.delete({
      where: { id: mentorProfileId },
    });
  }

  static async create(data: Prisma.MentorProfileCreateInput) {
    return prisma.mentorProfile.create({
      data,
    });
  }
}
