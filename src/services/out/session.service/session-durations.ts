import { SessionType } from "@prisma/client";

export const SESSION_DURATION_BY_TYPE: Record<SessionType, number> = {
  [SessionType.VIBE_CHECK]: 15,
  [SessionType.ONE_SESSION]: 60,
  [SessionType.SESSIONS_PACK]: 60,
};
