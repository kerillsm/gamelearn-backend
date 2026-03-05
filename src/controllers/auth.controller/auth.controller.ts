import { Context } from "koa";
import { appConfig } from "../../config/appConfig";
import { HttpError } from "../../lib/formatters/httpError";
import { AuthRequired } from "../../lib/decorators/authRequired.decorator";
import {
  GetOrCreateUserByAuthProviderService,
  GetOrCreateUserByAuthProviderDTO,
} from "../../services/in/get-or-create-user-by-auth-provider.service";
import { RefreshTokenService } from "../../services/in/refresh-token-service";
import { AuthorizeService } from "../../services/in/authorize-user.service";
import { VerifyEmailService } from "../../services/in/verify-email.service/verify-email.service";

export class AuthController {
  static getOrCreateUser = async (data: GetOrCreateUserByAuthProviderDTO) => {
    return GetOrCreateUserByAuthProviderService.execute(data);
  };

  @AuthRequired()
  static async authorize(ctx: Context) {
    const user = ctx.state.user!;

    const { accessTokenPayload, redirectUrl, refreshTokenPayload } =
      AuthorizeService.authorize(user, ctx.query.state);

    ctx.cookies.set("refresh_token", refreshTokenPayload.token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/auth/refresh",
      maxAge: appConfig.auth.refreshTokenDurationMinutes * 60 * 1000,
    });
    ctx.cookies.set("access_token", accessTokenPayload.token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: appConfig.auth.accessTokenDurationMinutes * 60 * 1000,
    });

    ctx.status = 200;
    ctx.redirect(redirectUrl.toString());
  }

  static async refreshToken(ctx: Context) {
    const refreshToken = ctx.cookies.get("refresh_token");
    if (!refreshToken) {
      throw new HttpError(401, "No refresh token provided");
    }

    const tokenPayload = await RefreshTokenService.refresh(refreshToken);

    ctx.cookies.set("access_token", tokenPayload.token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: appConfig.auth.accessTokenDurationMinutes * 60 * 1000,
    });
    ctx.status = 200;
    ctx.body = {
      success: true,
    };
  }

  static async logOut(ctx: Context) {
    ctx.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/auth/refresh",
      maxAge: 0,
    });
    ctx.cookies.set("access_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 0,
    });
    ctx.status = 200;
    ctx.body = { success: true };
  }

  static async verifyEmail(ctx: Context) {
    const token = (ctx.query.token as string) || "";
    try {
      const result = await VerifyEmailService.execute(token);
      ctx.status = 200;
      ctx.body = result;
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        ctx.status = err.status;
        ctx.body = { success: false, error: err.message };
        return;
      }
      throw err;
    }
  }
}
