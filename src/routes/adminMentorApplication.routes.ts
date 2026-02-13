import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { adminMiddleware } from "../lib/middleware/adminMiddleware";
import { AdminMentorApplicationController } from "../controllers/adminMentorApplication.controller";

const router = new Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  AdminMentorApplicationController.list,
);

router.post(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  AdminMentorApplicationController.approve,
);

router.post(
  "/:id/reject",
  authMiddleware,
  adminMiddleware,
  AdminMentorApplicationController.reject,
);

export { router as adminMentorApplicationRoutes };
