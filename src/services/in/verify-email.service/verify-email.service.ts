import { HttpError } from "../../../lib/formatters/httpError";
import { UserService } from "../../out/user.service";

export class VerifyEmailService {
  static async execute(token: string): Promise<{ success: true }> {
    if (!token || typeof token !== "string" || !token.trim()) {
      throw new HttpError(400, "Invalid or missing token");
    }

    const user = await UserService.getByEmailVerificationToken(token.trim());
    if (!user) {
      throw new HttpError(400, "Invalid or expired token");
    }

    await UserService.updateUser(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    });

    return { success: true };
  }
}
