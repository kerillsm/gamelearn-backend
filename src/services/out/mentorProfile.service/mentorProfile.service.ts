import { MentorProfileStatus, Prisma, SessionPackStatus } from "@prisma/client";
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

  static async getMentorProfiles(params: {
    query?: string;
    page?: number;
    take?: number;
  }) {
    const { query, page = 1, take = 10 } = params;
    const whereClause: Prisma.MentorProfileWhereInput = {
      status: MentorProfileStatus.ACTIVE,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { shortDescription: { contains: query, mode: "insensitive" } },
      ];
    }

    const mentorProfiles = await prisma.mentorProfile.findMany({
      where: whereClause,
      skip: (page - 1) * take,
      take,
      include: { user: { select: { slug: true } } },
    });
    const totalCount = await prisma.mentorProfile.count({ where: whereClause });

    return { mentorProfiles, totalCount };
  }

  static async getById(id: string) {
    return prisma.mentorProfile.findUnique({
      where: { id },
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

  static async getMentorProfilesAll(params: { page?: number; take?: number }) {
    const { page = 1, take = 10 } = params;
    const mentorProfiles = await prisma.mentorProfile.findMany({
      skip: (page - 1) * take,
      take,
      include: { user: { select: { slug: true } } },
    });
    const totalCount = await prisma.mentorProfile.count();
    return { mentorProfiles, totalCount };
  }

  static async getPendingProfiles() {
    return prisma.mentorProfile.findMany({
      where: { status: MentorProfileStatus.PENDING },
      include: { user: { select: { slug: true } } },
    });
  }

  static async updateStatus(
    id: string,
    status: MentorProfileStatus,
    rejectionReason?: string,
  ) {
    return prisma.mentorProfile.update({
      where: { id },
      data: { status, ...(rejectionReason != null && { rejectionReason }) },
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

  static async getPendingTestimonialsProfiles(userId: string) {
    return prisma.mentorProfile.findMany({
      where: {
        user: {
          mentorSessionPacks: {
            some: {
              applicantId: userId,
              status: SessionPackStatus.COMPLETED,
            },
          },
          testimonialsReceived: {
            none: {
              userId,
            },
          },
        },
      },
      include: {
        user: {
          select: { slug: true },
        },
      },
    });
  }
}
