import { Prisma, SessionPackStatus, SessionPackageType } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export const SESSION_PACKAGE_DURATION_BY_TYPE: Record<
  SessionPackageType,
  number
> = {
  [SessionPackageType.VIBE_CHECK]: 15,
  [SessionPackageType.ONE_SESSION]: 60,
  [SessionPackageType.SESSIONS_PACK]: 60,
};

export class SessionPackageService {
  static create(data: Prisma.SessionPackageCreateInput) {
    return prisma.sessionPackage.create({ data, include: { sessions: true } });
  }

  static getById(id: string) {
    return prisma.sessionPackage.findUnique({
      where: { id },
      include: { sessions: true, mentor: true, applicant: true },
    });
  }

  static getByIdWithSessions(id: string) {
    return prisma.sessionPackage.findUnique({
      where: { id },
      include: {
        sessions: { orderBy: { scheduledAt: "asc" } },
        mentor: { select: { id: true, name: true, picture: true, slug: true } },
        applicant: {
          select: { id: true, name: true, picture: true, slug: true },
        },
      },
    });
  }

  static async listPackages(
    filter: { applicantId?: string; mentorId?: string },
    options: { page: number; pageSize: number; status?: SessionPackStatus },
  ) {
    const { page, pageSize, status } = options;
    const where: Prisma.SessionPackageWhereInput = {
      ...(filter.applicantId && { applicantId: filter.applicantId }),
      ...(filter.mentorId && { mentorId: filter.mentorId }),
      ...(status && { status }),
    };

    const userSelect = { id: true, name: true, picture: true, slug: true };

    const [sessionPackages, total] = await Promise.all([
      prisma.sessionPackage.findMany({
        where,
        include: {
          mentor: { select: userSelect },
          applicant: { select: userSelect },
          sessions: { orderBy: { scheduledAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sessionPackage.count({ where }),
    ]);

    return { sessionPackages, total };
  }

  static getByStripeSessionPackageId(stripeSessionPackageId: string) {
    return prisma.sessionPackage.findUnique({
      where: { stripeSessionPackageId },
      include: {
        sessions: { orderBy: { scheduledAt: "asc" } },
        mentor: true,
        applicant: true,
      },
    });
  }

  static update(id: string, data: Prisma.SessionPackageUpdateInput) {
    return prisma.sessionPackage.update({
      where: { id },
      data,
    });
  }

  static updateStripeSessionPackageId(
    id: string,
    stripeSessionPackageId: string,
  ) {
    return prisma.sessionPackage.update({
      where: { id },
      data: { stripeSessionPackageId },
    });
  }

  static updateByStripeSessionPackageId(
    stripeSessionPackageId: string,
    data: Prisma.SessionPackageUpdateInput,
  ) {
    return prisma.sessionPackage.updateMany({
      where: { stripeSessionPackageId },
      data,
    });
  }

  static updateStatus(id: string, status: SessionPackStatus) {
    return prisma.sessionPackage.update({
      where: { id },
      data: { status },
    });
  }

  static deleteByStripeSessionPackageId(stripeSessionPackageId: string) {
    return prisma.sessionPackage.deleteMany({
      where: { stripeSessionPackageId },
    });
  }

  static deleteById(id: string) {
    return prisma.sessionPackage.delete({
      where: { id },
    });
  }

  static getVibeCheckPackage(applicantId: string, mentorId: string) {
    return prisma.sessionPackage.findFirst({
      where: {
        applicantId,
        mentorId,
        type: SessionPackageType.VIBE_CHECK,
      },
      include: { sessions: true },
    });
  }

  static countCompletedPackagesByMentor(mentorId: string) {
    return prisma.sessionPackage.count({
      where: {
        mentorId,
        status: SessionPackStatus.COMPLETED,
      },
    });
  }

  static getApplicantPackagesWithMentorBySlug(
    applicantId: string,
    mentorSlug: string,
    status?: SessionPackStatus,
  ) {
    return prisma.sessionPackage.findMany({
      where: {
        applicantId,
        mentor: { slug: mentorSlug },
        ...(status && { status }),
      },
    });
  }
}
