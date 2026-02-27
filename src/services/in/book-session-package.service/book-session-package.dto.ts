import { SessionPackageType } from "@prisma/client";

export interface BookSessionPackageDTO {
  userId: string;
  mentorSlug: string;
  sessionType: SessionPackageType;
  sessions: { date: string; startTime: string }[];
}
