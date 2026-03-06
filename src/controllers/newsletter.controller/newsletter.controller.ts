import { Context } from "koa";
import { HttpError } from "../../lib/formatters/httpError";
import { SubscribeNewsletterService } from "../../services/in/subscribe-newsletter.service";
import { UnsubscribeNewsletterService } from "../../services/in/unsubscribe-newsletter.service";
import { CreateNewsletterService } from "../../services/in/create-newsletter.service";
import { NewsletterSubscriptionService } from "../../services/out/newsletterSubscription.service";

export class NewsletterController {
  static async subscribe(ctx: Context) {
    const user = ctx.state.user!;
    const ipAddress = ctx.ip ?? ctx.request.ip;
    const userAgent = ctx.get("User-Agent");
    const result = await SubscribeNewsletterService.execute(user.id, {
      ipAddress,
      userAgent: userAgent || undefined,
    });
    ctx.status = 200;
    ctx.body = result;
  }

  static async unsubscribe(ctx: Context) {
    const token = (ctx.query.token as string) || "";
    try {
      const result = await UnsubscribeNewsletterService.execute(token);
      ctx.status = 200;
      ctx.body = result;
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        ctx.status = err.status;
        ctx.body = { success: false, error: err.message };
        return;
      }
      throw err;
    }
  }

  static async getSubscriptionStatus(ctx: Context) {
    const user = ctx.state.user!;
    const subscription = await NewsletterSubscriptionService.findByEmail(user.email);
    ctx.status = 200;
    ctx.body = { subscribed: !!subscription };
  }

  static async getSubscribersCount(ctx: Context) {
    const count = await NewsletterSubscriptionService.getActiveCount();
    ctx.status = 200;
    ctx.body = { count };
  }

  static async createNewsletter(ctx: Context) {
    const body = ctx.request.body as { content?: string };
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      throw new HttpError(400, "Content is required");
    }
    const result = await CreateNewsletterService.execute(content);
    ctx.status = 200;
    ctx.body = result;
  }
}
