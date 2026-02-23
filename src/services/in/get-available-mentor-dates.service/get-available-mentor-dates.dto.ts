import { SessionPackageType } from "@prisma/client";

export interface GetAvailableMentorDatesDTO {
  mentorUserId: string;
  userId: string;
  sessionType: SessionPackageType;
  year: number;
  month: number;
}
