export const USER_PRIVATE_FIELDS = [
  "email",
  "discordUsername",
  "emailVerified",
  "timezone",
  "termsAcceptedAt",
  "stripeConnectAccountId",
  "stripeConnectStatus",
] as const;

export const USER_NEVER_FIELDS = [
  "emailVerificationToken",
  "authAccounts",
] as const;

export const SESSION_PACKAGE_NEVER_FIELDS = [
  "stripeSessionPackageId",
  "stripePaymentIntentId",
  "stripeRefundId",
  "refundAmount",
  "refundedAt",
  "cancellationReason",
  "rejectionReason",
] as const;
