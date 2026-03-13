import { HttpError } from "../../../lib/formatters/httpError";
import { UserService } from "../../out/user.service";
import { NewsletterSubscriptionService } from "../../out/newsletterSubscription.service";

export class SubscribeNewsletterService {
  static async execute(
    userId: string,
    options?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ success: true }> {
    const user = await UserService.getById(userId);
    if (!user) {
      throw new HttpError(401, "User not found");
    }

    const existing = await NewsletterSubscriptionService.findByEmail(user.email);
    if (existing) {
      return { success: true };
    }

    await NewsletterSubscriptionService.create({
      email: user.email,
      userId: user.id,
      consentedAt: new Date(),
      unsubscribeToken: crypto.randomUUID(),
      source: "modal",
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    return { success: true };
  }
}
