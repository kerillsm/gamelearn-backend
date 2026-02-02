import { SessionType, User } from "@prisma/client";
import { DateTime, Interval } from "luxon";
import { HttpError } from "../../../lib/formatters/httpError";
import { SESSION_DURATION_BY_TYPE, SessionService } from "../../out/session.service";
import { MentorAvailabilityService } from "../mentor-availability.service";
import { TimeSlotInput, ValidatedTimeSlot } from "./session-validation.interface";

export class SessionValidationService {
  static async validateTimeSlot(
    user: User,
    mentorUserId: string,
    sessionType: SessionType,
    slot: TimeSlotInput,
  ): Promise<ValidatedTimeSlot> {
    if (!user.timezone) {
      throw new HttpError(400, "User timezone not set");
    }

    const userDate = DateTime.fromFormat(slot.date, "yyyy-MM-dd", {
      zone: user.timezone,
    });
    if (!userDate.isValid) {
      throw new HttpError(400, "Invalid date format");
    }

    const start = userDate.set({
      hour: Number(slot.startTime.split(":")[0]),
      minute: Number(slot.startTime.split(":")[1]),
      millisecond: 0,
      second: 0,
    });
    if (!start.isValid) {
      throw new HttpError(400, "Invalid start time format");
    }

    const userInterval = Interval.fromDateTimes(
      start,
      start.plus({ minutes: SESSION_DURATION_BY_TYPE[sessionType] }),
    );

    if (!userInterval.isValid) {
      throw new HttpError(400, "Invalid date or time");
    }

    const availableIntervals = await MentorAvailabilityService.getAvailableIntervals(
      user,
      mentorUserId,
      userDate,
      sessionType,
    );

    if (!availableIntervals.some((interval) => interval.engulfs(userInterval))) {
      throw new HttpError(400, "Selected time is not available");
    }

    return {
      scheduledAt: userInterval.start!.toJSDate(),
      interval: userInterval,
    };
  }

  static async validateVibeCheckEligibility(
    userId: string,
    mentorUserId: string,
  ): Promise<void> {
    const existingVibeCheck = await SessionService.getVibeCheckSession(
      userId,
      mentorUserId,
    );
    if (existingVibeCheck) {
      throw new HttpError(
        400,
        "User has already taken a vibe check with this mentor",
      );
    }
  }
}
