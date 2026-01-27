import { UserService } from "../../out/user.service";

export class UpdateUserService {
  static async updateUser(
    userId: string,
    profileData: Partial<{
      name: string;
      picture: string;
      timezone: string;
    }>,
  ) {
    const user = await UserService.getById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user profile data
    const updatedUser = await UserService.updateUser(userId, {
      name: profileData.name ?? user.name,
      picture: profileData.picture ?? user.picture,
      timezone: profileData.timezone ?? user.timezone,
    });
    return updatedUser;
  }
}
