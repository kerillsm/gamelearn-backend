import { SESSION_PACKAGE_NEVER_FIELDS } from "./types";
import { serializeUser } from "./serializeUser";
import { serializeSession } from "./serializeSession";
import { getAllowPrivateUserIds } from "./getAllowPrivateUserIds";
import { omit } from "./omit";
import { Session, SessionPackage, User } from "@prisma/client";

export async function serializeSessionPackage(
  pkg: SessionPackage & {
    mentor?: Partial<User>;
    applicant?: Partial<User>;
    sessions?: Session[];
  },
  viewerId?: string | Set<string> | null,
) {
  const allowSet =
    typeof viewerId === "string"
      ? await getAllowPrivateUserIds(viewerId)
      : (viewerId ?? null);

  const { mentor, applicant, sessions, ...rest } = omit(
    pkg,
    SESSION_PACKAGE_NEVER_FIELDS,
  );

  return {
    ...rest,
    mentor: mentor ? await serializeUser(mentor, allowSet) : undefined,
    applicant: applicant ? await serializeUser(applicant, allowSet) : undefined,
    sessions: sessions ? sessions.map((s) => serializeSession(s)) : undefined,
  };
}
