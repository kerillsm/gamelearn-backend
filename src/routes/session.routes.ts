import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { SessionController } from "../controllers/session.controller";

const router = new Router();

router.post(
  "/:sessionId/complete",
  authMiddleware,
  SessionController.completeSession,
);

export { router as sessionRoutes };
