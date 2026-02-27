export interface CreateCheckoutParams {
  sessionPackageId: string;
  amount: number; // in cents
  mentorName: string;
  sessionType: string;
  successUrl: string;
  cancelUrl: string;
  // Fee metadata (all amounts in cents)
  mentorUserId: string;
  platformCommissionPct: number;
  platformCommissionCents: number;
  mentorPayoutCents: number;
  clientReferralBonusCents: number;
  mentorReferralBonusCents: number;
  clientReferralId: string | null;
  mentorReferralId: string | null;
  clientReferrerUserId: string | null;
  mentorReferrerUserId: string | null;
}
