import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { MentorApplicationController } from "../controllers/mentorApplication.controller";
import { verifiedEmailMiddleware } from "../lib/middleware/verifiedEmailMiddleware";

const router = new Router();

router.post(
  "/",
  authMiddleware,
  verifiedEmailMiddleware,
  MentorApplicationController.createApplication,
);

export { router as mentorApplicationRoutes };
