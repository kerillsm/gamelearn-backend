import { RRule } from "rrule";
import { DateTime } from "luxon";

const rruleCache = new Map<string, RRule>();

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
