import { Session, SessionPackage } from "@prisma/client";

export interface BookSessionPackageResult {
  sessionPackage: SessionPackage & { sessions: Session[] };
  checkoutUrl: string | null;
}
