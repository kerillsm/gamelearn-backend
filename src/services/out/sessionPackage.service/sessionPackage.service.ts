import {
  MentorProfileStatus,
  Prisma,
  SessionPackStatus,
  SessionPackageType,
} from "@prisma/client";
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

  static getAll(
    where: Prisma.SessionPackageWhereInput,
    include: Prisma.SessionPackageInclude,
  ) {
    return prisma.sessionPackage.findMany({ where, include });
  }

  static async listPackages(
    filter: { applicantId?: string; mentorId?: string },
    options: {
      page: number;
      pageSize: number;
      status?: SessionPackStatus;
      year?: number;
      monthIndex?: number;
      all?: boolean;
    },
  ) {
    const { page, pageSize, status, year, monthIndex, all } = options;
    const hasMonthFilter =
      Number.isInteger(year) &&
      Number.isInteger(monthIndex) &&
      (monthIndex as number) >= 0 &&
      (monthIndex as number) <= 11;

    const monthStart = hasMonthFilter
      ? new Date(
          Date.UTC(year as number, (monthIndex as number) - 1, 1, 0, 0, 0, 0),
        )
      : undefined;
    const monthEnd = hasMonthFilter
      ? new Date(
          Date.UTC(year as number, (monthIndex as number) + 2, 1, 0, 0, 0, 0),
        )
      : undefined;

    const where: Prisma.SessionPackageWhereInput = {
      ...(filter.applicantId && { applicantId: filter.applicantId }),
      ...(filter.mentorId && { mentorId: filter.mentorId }),
      ...(status && { status }),
      ...(hasMonthFilter &&
        monthStart &&
        monthEnd && {
          sessions: {
            some: {
              scheduledAt: {
                gte: monthStart,
                lt: monthEnd,
              },
            },
          },
        }),
    };

    const userSelect = { id: true, name: true, picture: true, slug: true };

    const [sessionPackages, total] = await Promise.all([
      prisma.sessionPackage.findMany({
        where,
        include: {
          mentor: {
            include: {
              mentorProfiles: { where: { status: MentorProfileStatus.ACTIVE } },
            },
          },
          applicant: { select: userSelect },
          sessions: { orderBy: { scheduledAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        ...(all ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
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
      include: { sessions: true, mentor: true, applicant: true },
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
