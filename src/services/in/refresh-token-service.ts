import jwt from "jsonwebtoken";
import { appConfig } from "../../config/appConfig";
import { HttpError } from "../../lib/formatters/httpError";
import { UserService } from "../out/user.service";
import { generateToken } from "../out/auth.service/generateToken";

const accessTokenDurationMinutes = 15;

export class RefreshTokenService {
  static async refresh(refreshToken: string) {
    const payload = jwt.verify(refreshToken, appConfig.auth.refreshTokenSecret);
    if (!payload) {
      throw new HttpError(401, "Invalid refresh token");
    }

    const { id, email, role } = payload as {
      id: number;
      email: string;
      role: string;
    };
    if (!id || !email || !role) {
      throw new HttpError(401, "Invalid refresh token");
    }

    const user = await UserService.getByEmail(email);
    if (!user) {
      throw new HttpError(401, "User not found");
    }

    const tokenPayload = generateToken({
      email: user.email,
      id: user.id,
      role: user.role,
      tokenType: "accessToken",
      expiresInMinutes: accessTokenDurationMinutes,
    });

    return tokenPayload;
  }
}
