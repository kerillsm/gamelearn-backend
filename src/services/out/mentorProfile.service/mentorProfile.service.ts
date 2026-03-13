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

  static async getFiltersOptions(): Promise<{
    tags: string[];
    ratingMin: number | null;
    ratingMax: number | null;
  }> {
    const [profilesWithTags, ratingAgg] = await Promise.all([
      prisma.mentorProfile.findMany({
        where: { status: MentorProfileStatus.ACTIVE },
        select: { tags: true },
      }),
      prisma.mentorProfile.aggregate({
        where: {
          status: MentorProfileStatus.ACTIVE,
          gameRating: { not: null },
        },
        _min: { gameRating: true },
        _max: { gameRating: true },
      }),
    ]);

    const tags = Array.from(
      new Set(profilesWithTags.flatMap((p) => p.tags))
    ).sort();

    return {
      tags,
      ratingMin: ratingAgg._min.gameRating ?? null,
      ratingMax: ratingAgg._max.gameRating ?? null,
    };
  }

  static async getMentorProfiles(params: {
    query?: string;
    page?: number;
    take?: number;
    ratingMin?: number;
    ratingMax?: number;
    tags?: string[];
  }) {
    const { query, page = 1, take = 10, ratingMin, ratingMax, tags } = params;
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

    if (ratingMin != null || ratingMax != null) {
      whereClause.gameRating = {};
      if (ratingMin != null) {
        (whereClause.gameRating as Prisma.FloatFilter).gte = ratingMin;
      }
      if (ratingMax != null) {
        (whereClause.gameRating as Prisma.FloatFilter).lte = ratingMax;
      }
    }

    if (tags?.length) {
      whereClause.tags = { hasSome: tags };
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
      include: { user: { select: { slug: true, email: true } } },
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
