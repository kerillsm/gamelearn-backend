export interface PricingResult {
  totalPrice: number;
  sessionPrice: number;
  serviceFee: number;
  mentorEarnings: number;
  platformFee: number;
  clientReferralBonus: number;
  mentorReferralBonus: number;
  referralDiscount: number;
}

export interface ReferralContext {
  clientReferrerId: string | null;
  mentorReferrerId: string | null;
  mentorUserId: string;
}
