import "koa";

declare module "koa" {
  interface Request {
    rawBody?: string;
  }
}
