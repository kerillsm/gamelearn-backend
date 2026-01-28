import { Interval } from "luxon";

type GetStartTimesOptions = {
  durationMinutes: number;
  stepMinutes?: number;
  format?: string;
};

export function getAvailableStartTimes(
  intervals: Interval[],
  { durationMinutes, stepMinutes = 15, format = "HH:mm" }: GetStartTimesOptions,
): string[] {
  if (durationMinutes <= 0) {
    throw new Error("durationMinutes must be > 0");
  }

  const result: string[] = [];

  for (const interval of intervals) {
    const { start, end } = interval;

    if (!interval.isValid || !start || !end) continue;

    let cursor = start.startOf("minute");

    while (cursor.plus({ minutes: durationMinutes }) <= end) {
      result.push(cursor.toFormat(format));
      cursor = cursor.plus({ minutes: stepMinutes });
    }
  }

  return result;
}
