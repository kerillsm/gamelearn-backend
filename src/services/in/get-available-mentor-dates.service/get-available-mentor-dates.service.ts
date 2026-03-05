import { DateTime } from "luxon";
import { UserService } from "../../out/user.service";
import { MentorAvailabilityService } from "../mentor-availability.service";
import { GetAvailableMentorDatesDTO } from "./get-available-mentor-dates.dto";

export class GetAvailableMentorDates {
  static async getAvailableMentorDates({
    userId,
    mentorUserId,
    sessionType,
    year,
    month,
  }: GetAvailableMentorDatesDTO): Promise<string[]> {
    const user = await UserService.getById(userId);
    if (!user || !user.timezone) {
      throw new Error("User not found or timezone not set");
    }
    const userMonthStart = DateTime.fromObject(
      { year, month, day: 1 },
      { zone: user.timezone },
    ).startOf("day");
    const userMonthEnd = userMonthStart.endOf("month").endOf("day");

    if (!userMonthStart.isValid || !userMonthEnd.isValid) {
      throw new Error("Invalid year or month");
    }

    // Use UTC "now" then convert to user zone so "today" is correct at midnight
    // (DateTime.now() uses server zone and can be off by one day at 00:00 user time)
    const userToday = DateTime.utc()
      .setZone(user.timezone)
      .startOf("day");
    const isCurrentMonth =
      userToday.year === year && userToday.month === month;
    const startDay = isCurrentMonth
      ? (userToday > userMonthStart ? userToday : userMonthStart)
      : userMonthStart;

    // Result in ISO date strings
    const result: string[] = [];

    for (
      let day = startDay;
      day <= userMonthEnd;
      day = day.plus({ days: 1 })
    ) {
      const intervals = await MentorAvailabilityService.getAvailableIntervals(
        user,
        mentorUserId,
        day,
        sessionType,
      );

      const isoDate = day.toISODate();
      if (intervals.length > 0 && isoDate) {
        result.push(isoDate);
      }
    }

    return result;
  }
}
