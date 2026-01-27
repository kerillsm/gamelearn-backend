import { DateTime } from "luxon";
import { AvailabilityService } from "../../out/availability.service/availability.service";
import { UserService } from "../../out/user.service";

export class GetAvailabilityExceptionsService {
  static async getAvailabilityExceptions(mentorUserId: string) {
    const user = await UserService.getById(mentorUserId);
    if (!user || user.role !== "MENTOR" || !user.timezone) {
      throw new Error("User not found");
    }

    const now = DateTime.local();
    const startOfPreviousDay = now.minus({ days: 1 }).startOf("day").toJSDate();

    const exceptions =
      await AvailabilityService.getAvailabilityExceptionsByMentorUserId(
        mentorUserId,
        startOfPreviousDay,
      );

    return exceptions.map((exception) => {
      const exceptionDate = DateTime.fromJSDate(exception.date, {
        zone: exception.timezone,
      });

      const [startHour, startMinute] = exception.startTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = exception.endTime.split(":").map(Number);

      const startInExceptionTz = exceptionDate.set({
        hour: startHour,
        minute: startMinute,
      });
      const endInExceptionTz = exceptionDate.set({
        hour: endHour,
        minute: endMinute,
      });

      const startInUserTz = startInExceptionTz.setZone(user.timezone!);
      const endInUserTz = endInExceptionTz.setZone(user.timezone!);

      return {
        id: exception.id,
        date: startInUserTz.toISODate(),
        startTime: startInUserTz.toFormat("HH:mm"),
        endTime: endInUserTz.toFormat("HH:mm"),
        type: exception.type,
      };
    });
  }
}
