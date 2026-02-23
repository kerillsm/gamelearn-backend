import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { SessionController } from "../controllers/session.controller";

const router = new Router();

router.post(
  "/:sessionId/complete",
  authMiddleware,
  SessionController.completeSession,
);

router.post("/:sessionId/cancel", authMiddleware, SessionController.cancelSession);

export { router as sessionRoutes };
