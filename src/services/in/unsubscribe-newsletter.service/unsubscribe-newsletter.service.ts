import { HttpError } from "../../../lib/formatters/httpError";
import { NewsletterSubscriptionService } from "../../out/newsletterSubscription.service";

export class UnsubscribeNewsletterService {
  static async execute(token: string): Promise<{ success: true }> {
    if (!token || typeof token !== "string" || !token.trim()) {
      throw new HttpError(400, "Invalid or missing token");
    }

    const subscription = await NewsletterSubscriptionService.findByUnsubscribeToken(
      token.trim(),
    );
    if (!subscription) {
      throw new HttpError(400, "Invalid or expired unsubscribe link");
    }

    await NewsletterSubscriptionService.deleteByUnsubscribeToken(token.trim());
    return { success: true };
  }
}
