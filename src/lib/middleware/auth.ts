import jwt from "jsonwebtoken";
import { Context } from "koa";
import { UserRole } from "@prisma/client";
import { HttpError } from "../formatters/httpError";
import { appConfig } from "../../config/appConfig";

export const authMiddleware = async (
  ctx: Context,
  next: () => Promise<any>,
) => {
  try {
    const accessToken = ctx.cookies.get("access_token");

    if (!accessToken) {
      throw new HttpError(
        401,
        "Unauthorized: Missing or invalid Authorization header",
      );
    }

    try {
      const payload = jwt.verify(accessToken, appConfig.auth.jwtSecret) as {
        id: number;
        email: string;
        role: UserRole;
        iat: number;
        exp: number;
      };

      ctx.state.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      throw new HttpError(401, "Unauthorized");
    }

    await next();
  } catch (err: any) {
    if (err.status === 401) {
      throw new HttpError(401, "Unauthorized");
    } else if (err.status === 404) {
      throw new HttpError(404, "User not found");
    }

    throw err;
  }
};
