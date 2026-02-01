import { SessionType } from "@prisma/client";

export interface GetAvailableMentorDatesDTO {
  userId: string;
  mentorUserId: string;
  date: string;
  sessionType: SessionType;
}
