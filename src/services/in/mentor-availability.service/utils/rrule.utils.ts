import { RRule } from "rrule";
import { DateTime } from "luxon";

const rruleCache = new Map<string, RRule>();

const BYDAY_TO_LUXON_WEEKDAY: Record<string, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

export function getCachedRRule(rruleString: string): RRule {
  if (!rruleCache.has(rruleString)) {
    rruleCache.set(rruleString, RRule.fromString(rruleString));
  }
  return rruleCache.get(rruleString)!;
}

export function rruleProducesOccurrenceInUserDay({
  rruleString,
  ruleTimezone,
  dayStart,
  dayEnd,
}: {
  rruleString: string;
  ruleTimezone: string;
  dayStart: DateTime;
  dayEnd: DateTime;
}): boolean {
  const bydayMatch = rruleString.match(/BYDAY=([A-Z,]+)/);
  if (bydayMatch) {
    const bydayValues = bydayMatch[1].split(",");
    const allowedWeekdays = new Set(
      bydayValues
        .map((d) => BYDAY_TO_LUXON_WEEKDAY[d.trim()])
        .filter((w): w is number => w !== undefined),
    );
    const userWeekday = dayStart.weekday;
    return allowedWeekdays.has(userWeekday);
  }

  const rrule = getCachedRRule(rruleString);
  const windowStartInRuleTz = dayStart.setZone(ruleTimezone);
  const windowEndInRuleTz = dayEnd.setZone(ruleTimezone);

  const occurrences = rrule.between(
    windowStartInRuleTz.toJSDate(),
    windowEndInRuleTz.toJSDate(),
    true,
  );

  return occurrences.length > 0;
}
