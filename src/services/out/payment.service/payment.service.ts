import { PaymentStatus } from "@prisma/client";
import { prisma } from "../../../lib/orm/prisma";

export class PaymentService {
  static async create(data: {
    sessionPackageId: string;
    stripePaymentIntentId: string;
    amountCents: number;
    currency: string;
    platformCommissionPct: number;
    platformCommissionCents: number;
    mentorPayoutCents: number;
    status: PaymentStatus;
  }) {
    return prisma.payment.create({ data });
  }

  static async createPaymentReferral(data: {
    paymentId: string;
    referralId: string;
    amountCents: number;
  }) {
    return prisma.paymentReferral.create({ data });
  }
}
