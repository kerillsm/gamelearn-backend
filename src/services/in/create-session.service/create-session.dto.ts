import { SessionType } from "@prisma/client";

export interface CreateSessionDTO {
  userId: string;
  mentorSlug: string;
  sessionType: SessionType;
  sessions: { date: string; startTime: string }[];
}
