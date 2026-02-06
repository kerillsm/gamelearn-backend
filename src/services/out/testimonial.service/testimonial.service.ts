import { MentorProfileStatus, Prisma, TestimonialStatus } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class TestimonialService {
  static createTestimonial(
    userId: string,
    mentorUserId: string,
    data: {
      rating: number;
      comment: string;
    },
  ) {
    return prisma.testimonial.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        mentorUser: {
          connect: {
            id: mentorUserId,
          },
        },
        rating: data.rating,
        content: data.comment,
      },
    });
  }

  static updateTestimonial(
    testimonialId: string,
    data: {
      rating?: number;
      content?: string;
    },
  ) {
    return prisma.testimonial.update({
      where: {
        id: testimonialId,
      },
      data: {
        rating: data.rating,
        content: data.content,
      },
    });
  }

  static getTestimonialsGivenByUser(userId: string, skip = 0, take = 10) {
    return prisma.testimonial.findMany({
      where: {
        userId,
      },
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        mentorUser: {
          include: {
            mentorProfiles: {
              where: {
                status: MentorProfileStatus.ACTIVE,
              },
            },
          },
        },
        user: true,
      },
    });
  }

  static updateTestimonialStatus(
    testimonialId: string,
    status: TestimonialStatus,
  ) {
    return prisma.testimonial.update({
      where: {
        id: testimonialId,
      },
      data: {
        status,
      },
    });
  }

  static getUserTestimonialBySlug(userId: string, slug: string) {
    return prisma.testimonial.findFirst({
      where: {
        userId,
        mentorUser: {
          slug,
        },
      },
    });
  }

  static getMentorTestimonialsBySlug(slug: string, take = 10) {
    return prisma.testimonial.findMany({
      where: {
        mentorUser: {
          slug,
        },
        status: TestimonialStatus.APPROVED,
      },
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
      },
    });
  }

  static getTestimonialsCount(where: Prisma.TestimonialWhereInput) {
    return prisma.testimonial.count({
      where,
    });
  }

  static getLatestTestimonials() {
    return prisma.testimonial.findMany({
      where: {
        status: TestimonialStatus.APPROVED,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        mentorUser: {
          include: {
            mentorProfiles: {
              where: {
                status: MentorProfileStatus.ACTIVE,
              },
            },
          },
        },
        user: true,
      },
    });
  }

  static getTestimonialsAverageRating(where: Prisma.TestimonialWhereInput) {
    return prisma.testimonial.aggregate({
      where,
      _avg: {
        rating: true,
      },
    });
  }
}
