import { Context, Next } from "koa";

export const stripeWebhookMiddleware = async (ctx: Context, next: Next) => {
  if (ctx.path === "/payment/webhook" && ctx.method === "POST") {
    const chunks: Buffer[] = [];
    for await (const chunk of ctx.req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);
    ctx.request.rawBody = rawBody.toString("utf8");
    ctx.request.body = JSON.parse(ctx.request.rawBody);
  }
  return next();
};
