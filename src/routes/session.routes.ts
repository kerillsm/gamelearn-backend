import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { SessionController } from "../controllers/session.controller";

const router = new Router();

// List sessions (as student)
router.get("/my-sessions", authMiddleware, SessionController.getMySessions);

// List sessions (as mentor)
router.get("/mentor-sessions", authMiddleware, SessionController.getMentorSessions);

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

// Mentor marks session as complete (triggers referral payouts)
router.post("/:sessionId/complete", authMiddleware, SessionController.completeSession);

// Cancel paid/approved session with refund
router.post("/:sessionId/cancel", authMiddleware, SessionController.cancelSession);

export { router as sessionRoutes };
