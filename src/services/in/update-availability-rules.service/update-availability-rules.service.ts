import { AvailabilityService } from "../../out/availability.service/availability.service";
import { UpdateAvailabilityRulesDto } from "./update-availability-rules.dto";
import { transformAvailabilityDtoToRules } from "./transform-availability-dto-to-rules";
import { UserService } from "../../out/user.service";

export class UpdateAvailabilityRulesService {
  static async updateAvailabilityRules(
    mentorUserId: string,
    availabilityRules: UpdateAvailabilityRulesDto,
  ) {
    const user = await UserService.getById(mentorUserId);
    if (!user || !user.timezone || user.role !== "MENTOR") {
      throw new Error("Invalid mentor user ID or missing timezone");
    }
    // Remove existing availability rules
    await AvailabilityService.removeByMentorUserId(mentorUserId);
    // Create new availability rules
    const rulesToCreate = transformAvailabilityDtoToRules(
      mentorUserId,
      availabilityRules,
      user.timezone,
    );

    // Save new rules to the database
    await AvailabilityService.createAvailabilityRule(rulesToCreate);
  }
}
