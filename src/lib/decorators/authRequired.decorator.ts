import { Context, Next } from "koa";

export function AuthRequired() {
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

      return originalMethod.call(this, ctx, next);
    };
  };
}
