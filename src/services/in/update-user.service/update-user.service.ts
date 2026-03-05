import crypto from "crypto";
import { HttpError } from "../../../lib/formatters/httpError";
import { appConfig } from "../../../config/appConfig";
import { UserService } from "../../out/user.service";
import {
  EmailService,
  buildEmailVerificationEmail,
} from "../../out/email.service";

export class UpdateUserService {
  static async updateUser(
    userId: string,
    profileData: Partial<{
      name: string;
      email: string;
      picture: string;
      timezone: string;
    }>,
  ) {
    const user = await UserService.getById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const updates: Parameters<typeof UserService.updateUser>[1] = {
      name: profileData.name ?? user.name,
      picture: profileData.picture ?? user.picture,
      timezone: profileData.timezone ?? user.timezone,
    };

    if (
      profileData.email !== undefined &&
      // If email is changed or user is not verified, send verification email
      (profileData.email !== user.email || !user.emailVerified)
    ) {
      const existingByEmail = await UserService.getByEmail(profileData.email);
      if (existingByEmail && existingByEmail.id !== userId) {
        throw new HttpError(400, "Email already in use");
      }
      const token = crypto.randomBytes(32).toString("hex");
      updates.email = profileData.email;
      updates.emailVerified = false;
      updates.emailVerificationToken = token;

      const verificationLink = `${appConfig.frontendUrl}/auth/verify-email?token=${token}`;
      try {
        await EmailService.sendEmail(
          buildEmailVerificationEmail({
            to: profileData.email,
            userName: user.name,
            verificationLink,
          }),
        );
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }
    }

    return UserService.updateUser(userId, updates);
  }
}
