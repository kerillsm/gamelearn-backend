import { Context } from "koa";
import { StripeService } from "../../services/out/stripe.service";
import { HandleCheckoutCompletedService } from "../../services/in/handle-checkout-completed.service";
import { HandleCheckoutExpiredService } from "../../services/in/handle-checkout-expired.service";
import { HandleConnectAccountUpdatedService } from "../../services/in/handle-connect-account-updated.service";
import { HttpError } from "../../lib/formatters/httpError";

export class PaymentController {
  static async handleWebhook(ctx: Context) {
    const signature = ctx.request.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      throw new HttpError(400, "Missing Stripe signature");
    }

    // Raw body is required for webhook verification
    const rawBody = ctx.request.rawBody;
    if (!rawBody) {
      throw new HttpError(400, "Missing request body");
    }

    let event;
    try {
      event = StripeService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new HttpError(400, "Webhook signature verification failed");
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        if (StripeService.isCheckoutSessionEvent(event)) {
          const session = event.data.object;
          await HandleCheckoutCompletedService.execute(session);
        }
        break;
      }
      case "checkout.session.expired": {
        if (StripeService.isCheckoutSessionEvent(event)) {
          const session = event.data.object;
          await HandleCheckoutExpiredService.execute(session.id);
        }
        break;
      }
      case "account.updated": {
        if (StripeService.isAccountEvent(event)) {
          const account = event.data.object;
          await HandleConnectAccountUpdatedService.execute(account.id);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    ctx.status = 200;
    ctx.body = { received: true };
  }
}
