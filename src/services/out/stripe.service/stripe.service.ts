import Stripe from "stripe";
import { appConfig } from "../../../config/appConfig";
import { CreateCheckoutParams } from "./stripe.interface";

const stripe = new Stripe(appConfig.stripe.secretKey);

export class StripeService {
  static async createCheckoutSession(params: CreateCheckoutParams) {
    const {
      sessionPackageId,
      amount,
      mentorName,
      sessionType,
      successUrl,
      cancelUrl,
      mentorUserId,
      platformCommissionPct,
      platformCommissionCents,
      mentorPayoutCents,
      clientReferralBonusCents,
      mentorReferralBonusCents,
      clientReferralId,
      mentorReferralId,
      clientReferrerUserId,
      mentorReferrerUserId,
    } = params;

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
        sessionPackageId,
        mentorUserId,
        platformCommissionPct: String(platformCommissionPct),
        platformCommissionCents: String(platformCommissionCents),
        mentorPayoutCents: String(mentorPayoutCents),
        clientReferralBonusCents: String(clientReferralBonusCents),
        mentorReferralBonusCents: String(mentorReferralBonusCents),
        ...(clientReferralId && { clientReferralId }),
        ...(mentorReferralId && { mentorReferralId }),
        ...(clientReferrerUserId && { clientReferrerUserId }),
        ...(mentorReferrerUserId && { mentorReferrerUserId }),
      },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
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

  // --- Payment capture: fetch PaymentIntent, Charge, BalanceTransaction for fee/net ---

  static async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Returns the Charge for a PaymentIntent (expands latest_charge if needed).
   */
  static async getChargeFromPaymentIntent(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<Stripe.Charge | null> {
    const latestChargeId =
      typeof paymentIntent.latest_charge === "string"
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id;
    if (!latestChargeId) return null;
    const charge = await stripe.charges.retrieve(latestChargeId);
    return charge;
  }

  /**
   * Returns fee (cents) and net (cents) from the charge's balance transaction.
   */
  static async getBalanceTransactionFeeAndNet(
    charge: Stripe.Charge,
  ): Promise<{ feeCents: number; netCents: number }> {
    const btId =
      typeof charge.balance_transaction === "string"
        ? charge.balance_transaction
        : charge.balance_transaction?.id;
    if (!btId) {
      return { feeCents: 0, netCents: 0 };
    }
    const bt = await stripe.balanceTransactions.retrieve(btId);
    // Stripe amounts are in cents; fee and net are integers
    const feeCents = bt.fee ?? 0;
    const netCents = bt.net ?? 0;
    return { feeCents, netCents };
  }
}
