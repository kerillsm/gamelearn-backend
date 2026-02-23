export interface CreateCheckoutParams {
  sessionPackageId: string;
  amount: number; // in cents
  mentorName: string;
  sessionType: string;
  successUrl: string;
  cancelUrl: string;
}
