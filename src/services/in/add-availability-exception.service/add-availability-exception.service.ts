import { DateTime } from "luxon";
import { AvailabilityService } from "../../out/availability.service/availability.service";
import { UserService } from "../../out/user.service";
import { AddAvailabilityExceptionDto } from "./add-availability-exception.dto";

export class AddAvailabilityExceptionService {
  static async addAvailabilityException(
    userId: string,
    dto: AddAvailabilityExceptionDto,
  ) {
    const user = await UserService.getById(userId);
    if (!user || user.role !== "MENTOR" || !user.timezone) {
      throw new Error("User not found or invalid user role/timezone");
    }

    const date = DateTime.fromISO(dto.date, { zone: user.timezone }).startOf(
      "day",
    );

    if (!date.isValid) {
      throw new Error("Invalid date format");
    }

    await AvailabilityService.createAvailabilityException({
      mentorUser: {
        connect: { id: userId },
      },
      date: new Date(date.toFormat("yyyy-MM-dd")),
      startTime: dto.startTime,
      endTime: dto.endTime,
      type: dto.type,
      timezone: user.timezone,
    });
  }
}
