import { SessionPackageType } from "@prisma/client";

export const SESSION_DURATION_BY_TYPE: Record<SessionPackageType, number> = {
  [SessionPackageType.VIBE_CHECK]: 15,
  [SessionPackageType.ONE_SESSION]: 60,
  [SessionPackageType.SESSIONS_PACK]: 60,
};
