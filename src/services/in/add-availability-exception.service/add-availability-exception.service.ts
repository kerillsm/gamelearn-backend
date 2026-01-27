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

    await AvailabilityService.createAvailabilityException({
      mentorUser: {
        connect: { id: userId },
      },
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      type: dto.type,
      timezone: user.timezone,
    });
  }
}
