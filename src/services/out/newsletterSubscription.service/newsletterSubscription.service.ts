import { prisma } from "../../../lib/orm/prisma";
import { CreateNewsletterSubscriptionData } from "./types";

export class NewsletterSubscriptionService {
  static async create(data: CreateNewsletterSubscriptionData) {
    return prisma.newsletterSubscription.create({
      data: {
        email: data.email,
        userId: data.userId,
        consentedAt: data.consentedAt,
        unsubscribeToken: data.unsubscribeToken,
        source: data.source,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.newsletterSubscription.findUnique({
      where: { email },
    });
  }

  static async findByUnsubscribeToken(token: string) {
    return prisma.newsletterSubscription.findUnique({
      where: { unsubscribeToken: token },
    });
  }

  static async deleteByUnsubscribeToken(token: string) {
    return prisma.newsletterSubscription.delete({
      where: { unsubscribeToken: token },
    });
  }

  static async findAllActive() {
    return prisma.newsletterSubscription.findMany();
  }

  static async getActiveCount(): Promise<number> {
    return prisma.newsletterSubscription.count();
  }
}
