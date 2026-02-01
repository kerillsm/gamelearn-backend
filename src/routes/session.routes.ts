import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { SessionController } from "../controllers/session.controller";

const router = new Router();

router.post("/", authMiddleware, SessionController.createSession);

router.get(
  "/:mentorSlug/vibe-check",
  authMiddleware,
  SessionController.hasVibeCheckSession,
);

export { router as sessionRoutes };
