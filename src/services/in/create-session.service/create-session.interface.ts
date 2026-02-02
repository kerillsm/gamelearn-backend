import { Session } from "@prisma/client";

export interface CreateSessionResult {
  sessions: Session[];
  checkoutUrl: string | null;
}
