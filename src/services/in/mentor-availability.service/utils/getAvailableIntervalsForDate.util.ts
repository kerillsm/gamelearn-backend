import { DateTime, Interval } from "luxon";
import {
  buildExceptionIntervalForUserDay,
  buildIntervalForUserDay,
  mergeIntervals,
  subtractInterval,
} from "./interval.util";
import { rruleProducesOccurrenceInUserDay } from "./rrule.utils";
import {
  AvailabilityException,
  AvailabilityRule,
  ExceptionType,
  Session,
  SessionType,
} from "@prisma/client";
import { SESSION_DURATION_BY_TYPE } from "../../../out/session.service";

export function getAvailableIntervalsForDate({
  day,
  rules,
  exceptions,
  userTimezone,
  sessionType,
  bookings,
}: {
  day: DateTime;
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  bookings: Session[];
  userTimezone: string;
  sessionType: SessionType;
}) {
  let intervals: Interval<true>[] = [];

  const dayStart = day.startOf("day");
  const dayEnd = day.endOf("day");

  if (!dayStart.isValid || !dayEnd.isValid) {
    return [];
  }

  // 1. Rules
  for (const rule of rules) {
    if (
      !rruleProducesOccurrenceInUserDay({
        rruleString: rule.rrule,
        ruleTimezone: rule.timezone,
        dayStart,
        dayEnd,
      })
    ) {
      continue;
    }

    const interval = buildIntervalForUserDay({
      day,
      startTime: rule.startTime,
      endTime: rule.endTime,
      sourceTimezone: rule.timezone,
      targetTimezone: userTimezone,
    });

    if (interval?.isValid) intervals.push(interval);
  }

  intervals = mergeIntervals(intervals);

  // 2. Exceptions
  for (const ex of exceptions) {
    const interval = buildExceptionIntervalForUserDay(ex, userTimezone);

    if (!interval) continue;

    if (ex.type === ExceptionType.UNAVAILABLE) {
      intervals = subtractInterval(intervals, interval);
    }

    if (ex.type === ExceptionType.AVAILABLE) {
      intervals.push(interval);
      intervals = mergeIntervals(intervals);
    }
  }

  // 3. Bookings — ТІЛЬКИ duration
  for (const booking of bookings) {
    const start = DateTime.fromJSDate(booking.scheduledAt).setZone(
      userTimezone,
    );

    const end = start.plus({ minutes: booking.duration });

    const bookingInterval = Interval.fromDateTimes(start, end);

    if (!bookingInterval.isValid) continue;

    intervals = subtractInterval(intervals, bookingInterval);
  }

  intervals = intervals.filter(
    (interval) =>
      interval.length("minutes") >= SESSION_DURATION_BY_TYPE[sessionType],
  );

  return intervals;
}
