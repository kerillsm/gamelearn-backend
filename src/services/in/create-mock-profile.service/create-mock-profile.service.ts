import { randomUUID } from "crypto";
import { UserRole } from "@prisma/client";
import { UserService } from "../../out/user.service";
import { UpsertMentorProfileService } from "../upsert-mentor-profile.service";
import { UpsertMentorProfileDto } from "../upsert-mentor-profile.service/upsert-mentor-profile.dto";

export type CreateMockProfileDto = Omit<UpsertMentorProfileDto, "userId">;

export class CreateMockProfileService {
  static async execute(dto: CreateMockProfileDto) {
    const email = `mock+${randomUUID()}@example.com`;
    const user = await UserService.createUser({
      email,
      name: dto.name,
      role: UserRole.MENTOR,
    });
    return UpsertMentorProfileService.upsertProfile({
      ...dto,
      userId: user.id,
    });
  }
}
