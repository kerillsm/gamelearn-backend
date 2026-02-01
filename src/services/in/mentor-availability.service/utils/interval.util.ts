import { ExceptionType } from "@prisma/client";
import { DateTime, Interval } from "luxon";

export function mergeIntervals(intervals: Interval<true>[]): Interval<true>[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort(
    (a, b) => a.start.toMillis() - b.start.toMillis(),
  );

  const result: Interval<true>[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    if (current.overlaps(next) || current.abutsStart(next)) {
      const newInterval = Interval.fromDateTimes(
        current.start,
        current.end.toMillis() > next.end.toMillis() ? current.end : next.end,
      );
      if (!newInterval.isValid) {
        throw new Error("Invalid interval during merge");
      }
      current = newInterval;
    } else {
      result.push(current);
      current = next;
    }
  }

  result.push(current);
  return result;
}

/**
 * Віднімає інтервал toSubtract з масиву інтервалів
 */
export function subtractInterval(
  intervals: Interval<true>[], // гарантовано валідні
  toSubtract: Interval<true>, // гарантовано валідний
): Interval<true>[] {
  const result: Interval<true>[] = [];

  for (const interval of intervals) {
    if (!interval.overlaps(toSubtract)) {
      result.push(interval);
      continue;
    }

    // Частина до toSubtract
    if (toSubtract.start.toMillis() > interval.start.toMillis()) {
      const newInterval = Interval.fromDateTimes(
        interval.start,
        toSubtract.start,
      );
      if (!newInterval.isValid) {
        throw new Error("Invalid interval during subtraction");
      }
      result.push(newInterval);
    }

    // Частина після toSubtract
    if (toSubtract.end.toMillis() < interval.end.toMillis()) {
      const newInterval = Interval.fromDateTimes(toSubtract.end, interval.end);
      if (!newInterval.isValid) {
        throw new Error("Invalid interval during subtraction");
      }
      result.push(newInterval);
    }
  }

  return result;
}

/**
 * Створює інтервал доступності з правила (AvailabilityRule) для конкретного дня користувача
 */
export function buildIntervalForUserDay({
  day, // DateTime в user.timezone (початок дня)
  startTime, // 'HH:mm' з rule
  endTime, // 'HH:mm' з rule
  sourceTimezone, // rule.timezone
  targetTimezone, // user.timezone
}: {
  day: DateTime;
  startTime: string;
  endTime: string;
  sourceTimezone: string;
  targetTimezone: string;
}): Interval | null {
  try {
    // Конструюємо день у timezone правила
    // const ruleDayStart = day.setZone(sourceTimezone).startOf("day");

    // Парсимо startTime / endTime
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const dayInRuleTz = day.setZone(sourceTimezone).startOf("day");

    const intervalStart = dayInRuleTz.set({
      hour: startHour,
      minute: startMinute,
    });
    const intervalEnd = dayInRuleTz.set({ hour: endHour, minute: endMinute });
    if (!intervalStart.isValid || !intervalEnd.isValid) return null;

    // Проєкція у timezone користувача
    return Interval.fromDateTimes(
      intervalStart.setZone(targetTimezone),
      intervalEnd.setZone(targetTimezone),
    );
  } catch (err) {
    return null;
  }
}

/**
 * Створює інтервал з AvailabilityException для конкретного дня користувача
 */
export function buildExceptionIntervalForUserDay(
  exception: {
    date: Date;
    startTime: string;
    endTime: string;
    timezone: string;
    type: ExceptionType;
  },
  userTimezone: string,
): Interval | null {
  try {
    // Початок дня exception у його timezone
    const exDayStart = DateTime.fromJSDate(exception.date, {
      zone: exception.timezone,
    }).startOf("day");

    // Парсимо startTime / endTime
    const [startHour, startMinute] = exception.startTime.split(":").map(Number);
    const [endHour, endMinute] = exception.endTime.split(":").map(Number);

    const intervalStart = exDayStart.set({
      hour: startHour,
      minute: startMinute,
    });
    const intervalEnd = exDayStart.set({ hour: endHour, minute: endMinute });
    if (!intervalStart.isValid || !intervalEnd.isValid) return null;

    // Проєкція у timezone користувача
    return Interval.fromDateTimes(
      intervalStart.setZone(userTimezone),
      intervalEnd.setZone(userTimezone),
    );
  } catch (err) {
    return null;
  }
}
