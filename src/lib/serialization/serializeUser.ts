import { USER_NEVER_FIELDS, USER_PRIVATE_FIELDS } from "./types";
import { getAllowPrivateUserIds } from "./getAllowPrivateUserIds";
import { omit } from "./omit";
import { User } from "@prisma/client";

/**
 * Serialize user for API. When viewerId (or allowSet) is provided, private
 * fields are included if user.id is in the allow set.
 */
export async function serializeUser<T extends Partial<User>>(
  user: T,
  viewerId?: string | Set<string> | null,
) {
  const allowSet =
    typeof viewerId === "string"
      ? await getAllowPrivateUserIds(viewerId)
      : (viewerId ?? null);
  const includePrivate = allowSet?.has(user.id ?? "") ?? false;

  const neverOmit = omit(user, USER_NEVER_FIELDS);
  if (includePrivate) return neverOmit;

  return omit(neverOmit, USER_PRIVATE_FIELDS);
}
