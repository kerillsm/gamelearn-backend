import { serializeUser } from "./serializeUser";
import { getAllowPrivateUserIds } from "./getAllowPrivateUserIds";
import { Testimonial } from "@prisma/client";

export async function serializeTestimonial(
  testimonial: Testimonial & {
    user?: { id: string };
    mentorUser?: { id: string };
  },
  viewerId?: string | Set<string> | null,
) {
  const allowSet =
    typeof viewerId === "string"
      ? await getAllowPrivateUserIds(viewerId)
      : (viewerId ?? null);

  const { user, mentorUser, ...base } = testimonial;
  return {
    ...base,
    ...(user && { user: await serializeUser(user, allowSet) }),
    ...(mentorUser && {
      mentorUser: await serializeUser(mentorUser, allowSet),
    }),
  };
}
