import { SessionType } from "@prisma/client";

export interface GetAvailableMentorDatesDTO {
  mentorUserId: string;
  userId: string;
  sessionType: SessionType;
  year: number;
  month: number;
}
