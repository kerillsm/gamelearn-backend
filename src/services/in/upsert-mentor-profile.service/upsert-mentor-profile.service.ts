import { MentorProfileStatus } from "@prisma/client";
import { MentorProfileService } from "../../out/mentorProfile.service";
import { UserService } from "../../out/user.service";
import { UpsertMentorProfileDto } from "./upsert-mentor-profile.dto";
import { isValidSlug } from "./isValidSlug.util";

export class UpsertMentorProfileService {
  static async upsertProfile(dto: UpsertMentorProfileDto) {
    // Validate slug
    if (
      ["me", "admin", "root", "system"].includes(dto.slug) ||
      !isValidSlug(dto.slug)
    ) {
      throw new Error("This slug cannot be used");
    }
    // Update user's slug
    await UserService.updateUser(dto.userId, {
      slug: dto.slug,
    });

    // Remove existing pending mentor profile if any
    const pendingMentorProfile = await MentorProfileService.getByUserId(
      dto.userId,
      MentorProfileStatus.PENDING,
    );
    if (pendingMentorProfile) {
      await MentorProfileService.remove(pendingMentorProfile.id);
    }
    // Remove existing rejected mentor profile if any
    const rejectedMentorProfile = await MentorProfileService.getByUserId(
      dto.userId,
      MentorProfileStatus.REJECTED,
    );
    if (rejectedMentorProfile) {
      await MentorProfileService.remove(rejectedMentorProfile.id);
    }

    // Create new mentor profile with PENDING status
    return MentorProfileService.create({
      user: {
        connect: {
          id: dto.userId,
        },
      },
      description: dto.description,
      shortDescription: dto.shortDescription,
      imageUrl: dto.imageUrl,
      name: dto.name,
      game: dto.game,
      tags: dto.tags,
      gameRating: dto.gameRating,
      videoUrl: dto.videoUrl,
      status: MentorProfileStatus.PENDING,
    });
  }
}
