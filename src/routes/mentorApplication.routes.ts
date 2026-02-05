import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { MentorApplicationController } from "../controllers/mentorApplication.controller";

const router = new Router();

router.post("/", authMiddleware, MentorApplicationController.createApplication);

export { router as mentorApplicationRoutes };
