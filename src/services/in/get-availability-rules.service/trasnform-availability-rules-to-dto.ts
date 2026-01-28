import { AvailabilityRule } from "@prisma/client";
import { GetAvailabilityRulesDto } from "./get-availability-rules.dto";

import { DateTime } from "luxon";

export function transformAvailabilityRulesToDTO(
  rules: AvailabilityRule[],
  targetTimezone: string,
): GetAvailabilityRulesDto {
  const dto: GetAvailabilityRulesDto = [];

  return rules.reduce((acc, rule) => {
    const daysMatch = rule.rrule.match(/BYDAY=([A-Z,]+)/);
    if (!daysMatch) return acc;

    const days = daysMatch[1].split(",");

    for (const day of days) {
      const refDate = getNextWeekdayDate(day);

      const [startHour, startMinute] = rule.startTime.split(":").map(Number);
      const [endHour, endMinute] = rule.endTime.split(":").map(Number);

      // 1️⃣ Створюємо DateTime у timezone правила
      const startInRuleTz = refDate
        .set({
          hour: startHour,
          minute: startMinute,
        })
        .setZone(rule.timezone);

      const endInRuleTz = refDate
        .set({
          hour: endHour,
          minute: endMinute,
        })
        .setZone(rule.timezone);

      // 2️⃣ Конвертуємо у target timezone
      const startInTargetTz = startInRuleTz.setZone(targetTimezone);
      const endInTargetTz = endInRuleTz.setZone(targetTimezone);

      let dayEntry = acc.find((entry) => entry.day === day);
      if (!dayEntry) {
        dayEntry = { day, slots: [] };
        acc.push(dayEntry);
      }

      dayEntry.slots.push({
        startTime: startInTargetTz.toFormat("HH:mm"),
        endTime: endInTargetTz.toFormat("HH:mm"),
      });
    }

    return acc;
  }, dto);
}

const WEEKDAY_TO_LUXON: Record<string, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

function getNextWeekdayDate(weekday: string): DateTime {
  const today = DateTime.now().startOf("day");
  const targetWeekday = WEEKDAY_TO_LUXON[weekday];

  let date = today;
  while (date.weekday !== targetWeekday) {
    date = date.plus({ days: 1 });
  }

  return date;
}
