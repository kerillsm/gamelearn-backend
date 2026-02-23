import { DateTime } from "luxon";
import { AvailabilityService } from "../../out/availability.service/availability.service";
import { SessionService } from "../../out/session.service";
import { SessionStatus } from "@prisma/client";

const FETCH_BUFFER_DAYS = 2;

export async function fetchAvailabilityDataForUserMonth({
  mentorUserId,
  userTimezone,
  year,
  month,
}: {
  mentorUserId: string;
  userTimezone: string;
  year: number;
  month: number;
}) {
  const userMonthStart = DateTime.fromObject(
    { year, month, day: 1 },
    { zone: userTimezone },
  ).startOf("day");

  if (!userMonthStart.isValid) {
    throw new Error("Invalid year or month");
  }

  const userMonthEnd = userMonthStart.endOf("month");

  if (!userMonthEnd.isValid) {
    throw new Error("Invalid year or month");
  }

  const fetchStartDate = userMonthStart
    .minus({ days: FETCH_BUFFER_DAYS })
    .toJSDate();

  const fetchEndDate = userMonthEnd
    .plus({ days: FETCH_BUFFER_DAYS })
    .toJSDate();

  const [rules, exceptions, bookings] = await Promise.all([
    AvailabilityService.getAvailabilityRulesByMentorUserId(mentorUserId),
    AvailabilityService.getAvailabilityExceptionsByMentorUserId(mentorUserId, {
      gte: fetchStartDate,
      lte: fetchEndDate,
    }),
    SessionService.getSessionsByMentorForDateRange(
      mentorUserId,
      userMonthStart.toUTC().toJSDate(),
      userMonthEnd.toUTC().toJSDate(),
      [SessionStatus.APPROVED, SessionStatus.COMPLETED],
    ),
  ]);

  return {
    userMonthStart,
    userMonthEnd,
    rules,
    exceptions,
    bookings,
  };
}
