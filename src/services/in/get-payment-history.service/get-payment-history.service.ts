import { PaymentService } from "../../out/payment.service";

const DEFAULT_PAGE_SIZE = 10;

export interface PaymentHistoryItem {
  id: string;
  grossAmountCents: number;
  currency: string;
  status: string;
  sessionPackageId: string;
  sessionPackageType: string;
  createdAt: string;
}

export interface GetPaymentHistoryResult {
  payments: PaymentHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export class GetPaymentHistoryService {
  static async execute(
    applicantId: string,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<GetPaymentHistoryResult> {
    const { payments, total } = await PaymentService.listByApplicantId(
      applicantId,
      page,
      pageSize,
    );

    const items: PaymentHistoryItem[] = payments.map((p) => ({
      id: p.id,
      grossAmountCents: p.grossAmountCents,
      currency: p.currency,
      status: p.status,
      sessionPackageId: p.sessionPackageId,
      sessionPackageType: p.sessionPackage.type,
      createdAt: p.createdAt.toISOString(),
    }));

    return {
      payments: items,
      total,
      page,
      pageSize,
    };
  }
}
