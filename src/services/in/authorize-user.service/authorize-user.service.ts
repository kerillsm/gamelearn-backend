import { appConfig } from "../../../config/appConfig";
import { HttpError } from "../../../lib/formatters/httpError";
import { generateToken } from "../../out/auth.service";
import { isSafeRedirect } from "./isSafeRedirect";

export class AuthorizeService {
  static authorize(
    user: { email: string; id: string; role: string },
    state?: string | string[] | undefined,
  ) {
    if (Array.isArray(state)) {
      throw new HttpError(400, "Invalid state parameter");
    }
    const redirectToPage = state ? decodeURIComponent(state) : "/";

    if (!isSafeRedirect(redirectToPage)) {
      throw new HttpError(400, "Unsafe redirect URL");
    }

    const accessTokenPayload = generateToken({
      email: user.email,
      id: user.id,
      role: user.role,
      tokenType: "accessToken",
      expiresInMinutes: appConfig.auth.accessTokenDurationMinutes,
    });
    const refreshTokenPayload = generateToken({
      email: user.email,
      id: user.id,
      role: user.role,
      expiresInMinutes: appConfig.auth.refreshTokenDurationMinutes,
      tokenType: "refreshToken",
    });
    const redirectUrl = new URL(
      redirectToPage,
      appConfig.frontendUrl,
    ).toString();

    return {
      redirectUrl,
      accessTokenPayload,
      refreshTokenPayload,
    };
  }
}
