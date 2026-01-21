import Joi from "joi";
import { Context, Next } from "koa";
import { HttpError } from "../formatters/httpError";

export function Validate(schema: Joi.ObjectSchema) {
  return function (_: any, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (ctx: Context, next: Next) {
      const { error, value } = schema.validate(ctx.request.body);

      if (error) {
        ctx.status = 400;
        throw new HttpError(400, "Validation error: " + error.message);
      }

      ctx.request.body = value;
      return originalMethod.call(this, ctx, next);
    };
  };
}
