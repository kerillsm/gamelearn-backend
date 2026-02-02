export interface CreateCheckoutParams {
  sessionIds: string[];
  amount: number; // in cents
  mentorName: string;
  sessionType: string;
  successUrl: string;
  cancelUrl: string;
}
