import { Interval } from "luxon";

export interface ValidatedTimeSlot {
  scheduledAt: Date;
  interval: Interval;
}

export interface TimeSlotInput {
  date: string;
  startTime: string;
}
