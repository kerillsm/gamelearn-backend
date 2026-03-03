import type { SplitRole } from "@prisma/client";

export type ReleasePaymentResult = {
  groupsProcessed: number;
  payoutsCreated: number;
  skippedNoConnect: number;
  errors: string[];
};

export type ReleasableGroup = {
  userId: string;
  currency: string;
  amountCents: number;
  splitIds: string[];
  role: SplitRole;
};
