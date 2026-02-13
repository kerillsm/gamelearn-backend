import * as Sentry from "@sentry/node";
import { Context, Next } from "koa";
import { appConfig } from "../../config/appConfig";

export const errorHandlerMiddleware = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    const status =
      err.status ||
      err.statusCode ||
      (err.isAxiosError && err.response?.status) ||
      500;

    ctx.status = status;

    ctx.body = {
      message:
        status === 500
          ? "Internal Server Error"
          : err.message || "Unexpected error",
    };

    console.error("Error occurred:", err);

    if (status >= 500 && appConfig.sentry.dsn) {
      Sentry.captureException(err);
    }

    ctx.app.emit("error", err, ctx);
  }
};
