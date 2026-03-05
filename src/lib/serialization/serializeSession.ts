import { Session } from "@prisma/client";

export function serializeSession(session: Session): Session {
  return { ...session };
}
