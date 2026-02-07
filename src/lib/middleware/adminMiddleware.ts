import { Context } from "koa";
import { UserRole } from "@prisma/client";
import { HttpError } from "../formatters/httpError";

export const adminMiddleware = async (
  ctx: Context,
  next: () => Promise<unknown>,
) => {
  const user = ctx.state.user;
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN) {
    throw new HttpError(403, "Forbidden: Admin only");
  }
  await next();
};
