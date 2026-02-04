import Stripe from "stripe";
import { appConfig } from "../../../config/appConfig";
import { CreateCheckoutParams } from "./stripe.interface";

const stripe = new Stripe(appConfig.stripe.secretKey);

export class StripeService {
  static async createCheckoutSession(params: CreateCheckoutParams) {
    const {
      sessionIds,
      amount,
      mentorName,
      sessionType,
      successUrl,
      cancelUrl,
    } = params;

    // Using separate charges and transfers (not destination charges)
    // Money stays with platform until session is completed
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

  static isAccountEvent(
    event: Stripe.Event,
  ): event is Stripe.Event & { data: { object: Stripe.Account } } {
    return event.type.startsWith("account.");
  }

  // Stripe Connect methods
  static async createConnectAccount(email: string) {
    return stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        transfers: { requested: true },
      },
    });
  }

  static async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ) {
    return stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
  }

  static async createLoginLink(accountId: string) {
    return stripe.accounts.createLoginLink(accountId);
  }

  static async getAccount(accountId: string) {
    return stripe.accounts.retrieve(accountId);
  }

  static async createTransfer(
    accountId: string,
    amount: number,
    metadata?: Record<string, string>,
  ) {
    return stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      destination: accountId,
      metadata,
    });
  }

  static async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: "duplicate" | "fraudulent" | "requested_by_customer",
  ) {
    return stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Full refund if no amount
      reason,
    });
  }
}
