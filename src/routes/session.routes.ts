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

// Cancel pending sessions (when user cancels payment)
router.post("/cancel-pending", authMiddleware, SessionController.cancelPendingSessions);

// Mentor approves session and sets venue
router.post("/:sessionId/approve", authMiddleware, SessionController.approveSession);

// Mentor rejects session
router.post("/:sessionId/reject", authMiddleware, SessionController.rejectSession);

// Mentor updates venue
router.patch("/:sessionId/venue", authMiddleware, SessionController.setVenue);

export { router as sessionRoutes };
