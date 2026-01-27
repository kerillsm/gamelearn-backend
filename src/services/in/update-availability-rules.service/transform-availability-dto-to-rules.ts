import { Prisma } from "@prisma/client";
import { UpdateAvailabilityRulesDto } from "./update-availability-rules.dto";

export function transformAvailabilityDtoToRules(
  mentorUserId: string,
  availability: UpdateAvailabilityRulesDto,
  mentorTimezone: string,
): Prisma.AvailabilityRuleCreateManyInput[] {
  /**
   * Map key:
   * `${startTime}|${endTime}` → { days: [], startTime, endTime }
   */
  const map = new Map<
    string,
    { days: string[]; startTime: string; endTime: string }
  >();

  for (const dayConfig of availability) {
    const day = dayConfig.day;

    for (const slot of dayConfig.slots) {
      // skips empty slots from UI
      if (!slot.startTime || !slot.endTime) continue;

      const key = `${slot.startTime}|${slot.endTime}`;

      if (!map.has(key)) {
        map.set(key, {
          days: [day],
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      } else {
        map.get(key)!.days.push(day);
      }
    }
  }

  // Translate the final records for the database
  return Array.from(map.values()).map((group) => ({
    mentorUserId,
    rrule: `FREQ=WEEKLY;BYDAY=${group.days.join(",")}`,
    startTime: group.startTime,
    endTime: group.endTime,
    timezone: mentorTimezone,
  }));
}
