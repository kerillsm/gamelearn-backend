import { appConfig } from "../../../config/appConfig";
import { NewsletterSubscriptionService } from "../../out/newsletterSubscription.service";
import {
  EmailService,
  buildNewsletterEmail,
} from "../../out/email.service";

export class CreateNewsletterService {
  static async execute(content: string): Promise<{ sentCount: number }> {
    const subscribers = await NewsletterSubscriptionService.findAllActive();
    let sentCount = 0;

    for (const sub of subscribers) {
      const unsubscribeLink = `${appConfig.frontendUrl}/newsletter/unsubscribe?token=${encodeURIComponent(sub.unsubscribeToken)}`;
      const template = buildNewsletterEmail({
        to: sub.email,
        htmlContent: content,
        unsubscribeLink,
      });
      await EmailService.sendEmail(template);
      sentCount += 1;
    }

    return { sentCount };
  }
}
