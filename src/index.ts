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
import { storageRouter } from "./routes/storage.routes";

// Initialize Koa app
const app = new Koa();
// Enable proxy trust to get correct client IP when behind a proxy
app.proxy = true;
// Initialize router
const router = new Router();

// Middleware
app.use(
  cors({
    origin: appConfig.frontendUrl,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(koaBody());

// Routes
router.get("/health", async (ctx) => {
  ctx.body = { status: "ok" };
});

// Apply routes
router.use("/auth", authRoutes.routes(), authRoutes.allowedMethods());
router.use("/users", userRoutes.routes(), userRoutes.allowedMethods());
router.use("/storage", storageRouter.routes(), storageRouter.allowedMethods());
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
