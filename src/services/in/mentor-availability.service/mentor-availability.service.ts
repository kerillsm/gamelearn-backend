import { SessionType, User } from "@prisma/client";
import { fetchAvailabilityDataForUserMonth } from "./fetch-availability-data-for-user-month";
import { DateTime } from "luxon";
import { getAvailableIntervalsForDate } from "./utils/getAvailableIntervalsForDate.util";

export class MentorAvailabilityService {
  static async getAvailableIntervals(
    user: User,
    mentorUserId: string,
    lDate: DateTime,
    sessionType: SessionType,
  ) {
    if (!user || !user.timezone) {
      throw new Error("User not found or timezone not set");
    }

    const userTimezone = user.timezone;

    const { rules, exceptions, bookings } =
      await fetchAvailabilityDataForUserMonth({
        mentorUserId,
        userTimezone,
        year: lDate.year,
        month: lDate.month,
      });

    const intervals = getAvailableIntervalsForDate({
      day: lDate,
      rules,
      exceptions: exceptions.filter((ex) =>
        DateTime.fromJSDate(ex.date).hasSame(lDate, "day"),
      ),
      bookings,
      sessionType,
      userTimezone,
    });

    return intervals;
  }
}
