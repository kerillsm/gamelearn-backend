import Stripe from "stripe";
import { appConfig } from "../../../config/appConfig";
import { CreateCheckoutParams } from "./stripe.interface";

const stripe = new Stripe(appConfig.stripe.secretKey);

export class StripeService {
  static async createCheckoutSession(params: CreateCheckoutParams) {
    const { sessionIds, amount, mentorName, sessionType, successUrl, cancelUrl } = params;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${sessionType} with ${mentorName}`,
              description: `Mentoring session booking`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        sessionIds: JSON.stringify(sessionIds),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return checkoutSession;
  }

  static constructWebhookEvent(
    body: string | Buffer,
    signature: string,
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      appConfig.stripe.webhookSecret,
    );
  }

  static isCheckoutSessionEvent(
    event: Stripe.Event,
  ): event is Stripe.Event & { data: { object: Stripe.Checkout.Session } } {
    return event.type.startsWith("checkout.session.");
  }
}
