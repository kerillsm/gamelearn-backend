export interface CreateNewsletterSubscriptionData {
  email: string;
  userId?: string;
  consentedAt: Date;
  unsubscribeToken: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
}
