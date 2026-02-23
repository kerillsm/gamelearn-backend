import { Session, SessionPackage } from "@prisma/client";

export interface CreateSessionPackageResult {
  sessionPackage: SessionPackage & { sessions: Session[] };
  checkoutUrl: string | null;
}
