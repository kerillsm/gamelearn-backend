import { ExceptionType } from "@prisma/client";

export interface AddAvailabilityExceptionDto {
  date: string;
  type: ExceptionType;
  startTime: string;
  endTime: string;
}
