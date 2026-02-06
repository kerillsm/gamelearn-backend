import { TestimonialStatus } from "@prisma/client";
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

  static getTestimonialsForMentor(mentorUserId: string, skip = 0, take = 10) {
    return prisma.testimonial.findMany({
      where: {
        mentorUserId,
        status: TestimonialStatus.APPROVED,
      },
      skip,
      take,
      orderBy: {
        createdAt: "desc",
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
}
