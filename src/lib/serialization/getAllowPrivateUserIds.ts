import { SessionPackStatus } from "@prisma/client";
import { prisma } from "../orm/prisma";

/**
 * Returns the set of user IDs for which the viewer may see private fields
 * (self + mentors with approved/completed package when viewer is applicant,
 * applicants when viewer is mentor).
 */
export async function getAllowPrivateUserIds(
  viewerId: string,
): Promise<Set<string>> {
  const [asApplicant, asMentor] = await Promise.all([
    prisma.sessionPackage.findMany({
      where: {
        applicantId: viewerId,
        status: { in: [SessionPackStatus.APPROVED, SessionPackStatus.COMPLETED] },
      },
      select: { mentorId: true },
    }),
    prisma.sessionPackage.findMany({
      where: {
        mentorId: viewerId,
        status: { in: [SessionPackStatus.APPROVED, SessionPackStatus.COMPLETED] },
      },
      select: { applicantId: true },
    }),
  ]);

  const allow = new Set<string>([viewerId]);
  for (const row of asApplicant) allow.add(row.mentorId);
  for (const row of asMentor) allow.add(row.applicantId);
  return allow;
}
