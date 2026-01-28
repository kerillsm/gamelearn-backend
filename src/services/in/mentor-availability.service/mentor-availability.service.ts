import { SessionType } from "@prisma/client";
import { UserService } from "../../out/user.service";
import { fetchAvailabilityDataForUserMonth } from "./fetch-availability-data-for-user-month";
import { DateTime } from "luxon";
import { getAvailableStartTimes } from "./utils/getAvailableSlots.util";
import { SESSION_DURATION_BY_TYPE } from "../../out/session.service";
import { getAvailableIntervalsForDate } from "./utils/getAvailableIntervalsForDate.util";

export class MentorAvailabilityService {
  static async getAvailableMentorDates({
    userId,
    mentorUserId,
    sessionType,
    year,
    month,
  }: {
    mentorUserId: string;
    userId: string;
    sessionType: SessionType;
    year: number;
    month: number;
  }) {
    const user = await UserService.getById(userId);
    if (!user || !user.timezone) {
      throw new Error("User not found or timezone not set");
    }

    const userTimezone = user.timezone;

    // Fetch availability data
    const { userMonthStart, userMonthEnd, rules, exceptions, bookings } =
      await fetchAvailabilityDataForUserMonth({
        mentorUserId,
        userTimezone,
        year,
        month,
      });

    // Result in ISO date strings
    const result: string[] = [];

    for (
      let day = userMonthStart;
      day <= userMonthEnd;
      day = day.plus({ days: 1 })
    ) {
      const intervals = getAvailableIntervalsForDate({
        day,
        rules,
        userTimezone,
        sessionType,
      });

      if (intervals.length > 0) {
        result.push(day.toISODate());
      }
    }

    return result;
  }

  static async getMentorAvailableTimes(
    userId: string,
    mentorUserId: string,
    date: string,
    sessionType: SessionType,
  ) {
    const user = await UserService.getById(userId);
    if (!user || !user.timezone) {
      throw new Error("User not found or timezone not set");
    }

    const lDate = DateTime.fromISO(date, { zone: user.timezone });
    if (!lDate.isValid) {
      throw new Error("Invalid date format");
    }

    const userTimezone = user.timezone;

    const { rules } = await fetchAvailabilityDataForUserMonth({
      mentorUserId,
      userTimezone,
      year: lDate.year,
      month: lDate.month,
    });

    const intervals = getAvailableIntervalsForDate({
      day: lDate,
      rules,
      sessionType,
      userTimezone,
    });

    return getAvailableStartTimes(intervals, {
      durationMinutes: SESSION_DURATION_BY_TYPE[sessionType],
    });
  }
}
