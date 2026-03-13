import { Context } from "koa";
import { HttpError } from "../formatters/httpError";
import { UserService } from "../../services/out/user.service";

export const verifiedEmailMiddleware = async (
  ctx: Context,
  next: () => Promise<any>,
) => {
  if (!ctx.state.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const user = await UserService.getById(String(ctx.state.user.id));
  if (!user?.emailVerified) {
    throw new HttpError(403, "Email verification required");
  }

  await next();
};
