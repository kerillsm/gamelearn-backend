import { SessionPackageType } from "@prisma/client";

export interface CreateSessionPackageDTO {
  userId: string;
  mentorSlug: string;
  sessionType: SessionPackageType;
  sessions: { date: string; startTime: string }[];
}
