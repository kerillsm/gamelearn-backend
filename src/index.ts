import "dotenv/config";
import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";
import koaBody from "koa-body";
import fs from "fs";
import https from "https";
import { appConfig } from "./config/appConfig";
import { authRoutes } from "./routes/auth.routes";
import { userRoutes } from "./routes/user.routes";
import { storageRoutes } from "./routes/storage.routes";
import { mentorProfileRoutes } from "./routes/mentorProfile.routes";
import { errorHandlerMiddleware } from "./lib/middleware/errorHandlerMiddleware";
import { stripeWebhookMiddleware } from "./lib/middleware/stripeWebhookMiddleware";
import { availabilityRoutes } from "./routes/availability.routes";
import { sessionRoutes } from "./routes/session.routes";
import { paymentRoutes } from "./routes/payment.routes";
import { referralRoutes } from "./routes/referral.routes";
import { connectRoutes } from "./routes/connect.routes";
import { mentorApplicationRoutes } from "./routes/mentorApplication.routes";
import { testimonialRoutes } from "./routes/testimonial.routes";
import { adminMentorProfileRoutes } from "./routes/adminMentorProfile.routes";

// Initialize Koa app
const app = new Koa();
// Enable proxy trust to get correct client IP when behind a proxy
app.proxy = true;
// Initialize router
const router = new Router();

// Middleware
app.use(errorHandlerMiddleware);
app.use(
  cors({
    origin: appConfig.frontendUrl,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(stripeWebhookMiddleware);
// Conditionally apply koaBody - skip for webhook (already parsed)
const koaBodyMiddleware = koaBody();
app.use(async (ctx, next) => {
  if (ctx.path === "/payment/webhook" && ctx.method === "POST") {
    return next();
  }
  return koaBodyMiddleware(ctx, next);
});

// Routes
router.get("/health", async (ctx) => {
  ctx.body = { status: "ok" };
});

// Apply routes
router.use("/auth", authRoutes.routes(), authRoutes.allowedMethods());
router.use("/users", userRoutes.routes(), userRoutes.allowedMethods());
router.use("/storage", storageRoutes.routes(), storageRoutes.allowedMethods());
router.use(
  "/mentor-profile",
  mentorProfileRoutes.routes(),
  mentorProfileRoutes.allowedMethods(),
);
router.use(
  "/availability",
  availabilityRoutes.routes(),
  availabilityRoutes.allowedMethods(),
);
router.use("/sessions", sessionRoutes.routes(), sessionRoutes.allowedMethods());
router.use("/payment", paymentRoutes.routes(), paymentRoutes.allowedMethods());
router.use(
  "/referral",
  referralRoutes.routes(),
  referralRoutes.allowedMethods(),
);
router.use("/connect", connectRoutes.routes(), connectRoutes.allowedMethods());
router.use(
  "/mentor-application",
  mentorApplicationRoutes.routes(),
  mentorApplicationRoutes.allowedMethods(),
);
router.use(
  "/testimonial",
  testimonialRoutes.routes(),
  testimonialRoutes.allowedMethods(),
);
router.use(
  "/admin/mentor-profiles",
  adminMentorProfileRoutes.routes(),
  adminMentorProfileRoutes.allowedMethods(),
);
app.use(router.routes()).use(router.allowedMethods());

// Start server
if (appConfig.appEnv === "development") {
  https
    .createServer(
      {
        key: fs.readFileSync(process.env.HTTPS_KEY_PATH!, "utf8"),
        cert: fs.readFileSync(process.env.HTTPS_CERT_PATH!, "utf8"),
      },
      app.callback(),
    )
    .listen(appConfig.port, () => {
      console.log(
        `🚀 Gamelearn API Server (dev with HTTPS) running on port ${appConfig.port}`,
      );
    });
} else {
  app.listen(appConfig.port, async () => {
    console.log(`🚀 Gamelearn API Server running on port ${appConfig.port}`);
  });
}
