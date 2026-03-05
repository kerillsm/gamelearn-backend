import { UserRole } from "@prisma/client";
import { Context, Next } from "koa";
import { UserService } from "../../services/out/user.service";

export interface AuthRequiredOptions {
  emailVerified?: boolean;
}

export function AuthRequired(
  roles?: UserRole[],
  config?: AuthRequiredOptions,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (ctx: Context, next: Next) {
      if (!ctx.state.user) {
        ctx.status = 401;
        ctx.body = { error: "Unauthorized" };
        return;
      }

      const user = ctx.state.user;

      if (roles && roles.length > 0 && !roles.includes(user.role)) {
        ctx.status = 403;
        ctx.body = { error: "Forbidden: this action is not allowed for your role" };
        return;
      }

      if (config?.emailVerified) {
        const fullUser = await UserService.getById(user.id);
        if (!fullUser?.emailVerified) {
          ctx.status = 403;
          ctx.body = { error: "Email verification required" };
          return;
        }
      }

      return originalMethod.call(this, ctx, next);
    };
  };
}
