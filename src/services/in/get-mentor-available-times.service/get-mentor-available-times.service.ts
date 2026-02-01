import { DateTime } from "luxon";
import { UserService } from "../../out/user.service";
import { MentorAvailabilityService } from "../mentor-availability.service";
import { getAvailableStartTimes } from "../mentor-availability.service/utils/getAvailableSlots.util";
import { SESSION_DURATION_BY_TYPE } from "../../out/session.service";
import { GetAvailableMentorDatesDTO } from "./get-mentor-available-times.dto";

export class GetMentorAvailableTimes {
  static async getMentorAvailableTimes({
    userId,
    mentorUserId,
    date,
    sessionType,
  }: GetAvailableMentorDatesDTO) {
    const user = await UserService.getById(userId);
    if (!user || !user.timezone) {
      throw new Error("User not found or timezone not set");
    }

    const lDate = DateTime.fromISO(date, { zone: user.timezone });
    if (!lDate.isValid) {
      throw new Error("Invalid date format");
    }

    const intervals = await MentorAvailabilityService.getAvailableIntervals(
      user,
      mentorUserId,
      lDate,
      sessionType,
    );

    return getAvailableStartTimes(intervals, {
      durationMinutes: SESSION_DURATION_BY_TYPE[sessionType],
    });
  }
}
