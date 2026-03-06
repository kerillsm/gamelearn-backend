import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { adminMiddleware } from "../lib/middleware/adminMiddleware";
import { AdminMentorProfileController } from "../controllers/adminMentorProfile.controller";

const router = new Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  AdminMentorProfileController.listAll,
);

router.get(
  "/pending",
  authMiddleware,
  adminMiddleware,
  AdminMentorProfileController.listPending,
);

router.post(
  "/create-mock",
  authMiddleware,
  adminMiddleware,
  AdminMentorProfileController.createMockProfile,
);

router.post(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  AdminMentorProfileController.approve,
);

router.post(
  "/:id/reject",
  authMiddleware,
  adminMiddleware,
  AdminMentorProfileController.reject,
);

export { router as adminMentorProfileRoutes };
