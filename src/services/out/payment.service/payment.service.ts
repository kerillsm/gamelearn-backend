import { PaymentStatus } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

type PrismaClientLike = typeof prisma;

export class PaymentService {
  static async listByApplicantId(
    applicantId: string,
    page: number,
    pageSize: number,
  ) {
    const where = { sessionPackage: { applicantId } };
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          sessionPackage: { select: { id: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ]);
    return { payments, total };
  }

  static async getByStripePaymentIntentId(stripePaymentIntentId: string) {
    return prisma.payment.findUnique({
      where: { stripePaymentIntentId },
      include: {
        sessionPackage: {
          include: {
            sessions: true,
            mentor: true,
            applicant: true,
          },
        },
      },
    });
  }

  static async create(
    data: {
      sessionPackageId: string;
      stripePaymentIntentId: string;
      stripeCheckoutSessionId?: string | null;
      grossAmountCents: number;
      currency: string;
      stripeFeeCents?: number | null;
      netAmountCents?: number | null;
      status: PaymentStatus;
    },
    tx?: PrismaClientLike,
  ) {
    const client = tx ?? prisma;
    return client.payment.create({ data });
  }

  static async update(
    id: string,
    data: {
      status?: PaymentStatus;
      stripeFeeCents?: number | null;
      netAmountCents?: number | null;
    },
  ) {
    return prisma.payment.update({
      where: { id },
      data,
    });
  }

  static async createPaymentReferral(
    data: {
      paymentId: string;
      referralId: string;
      amountCents: number;
      percent: number;
    },
    tx?: PrismaClientLike,
  ) {
    const client = tx ?? prisma;
    return client.paymentReferral.create({ data });
  }
}
