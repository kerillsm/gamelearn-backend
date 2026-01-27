import { AvailabilityService } from "../../out/availability.service/availability.service";
import { UserService } from "../../out/user.service";
import { transformAvailabilityRulesToDTO } from "./trasnform-availability-rules-to-dto";

export class GetAvailabilityRulesService {
  static async getAvailabilityRules(mentorUserId: string) {
    const user = await UserService.getById(mentorUserId);
    if (!user || user.role !== "MENTOR" || !user.timezone) {
      throw new Error("User is not a mentor or does not have a timezone set");
    }
    const rules =
      await AvailabilityService.getAvailabilityRulesByMentorUserId(
        mentorUserId,
      );
    const dto = transformAvailabilityRulesToDTO(rules, user.timezone);
    return dto;
  }
}
