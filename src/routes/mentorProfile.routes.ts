import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { MentorProfileController } from "../controllers/mentorProfile.controller";

const router = new Router();

router.get("/", MentorProfileController.getMentorProfiles);

router.get(
  "/me",
  authMiddleware,
  MentorProfileController.getCurrentUserProfile,
);

router.get("/:slug", MentorProfileController.getBySlug);

router.post("/", authMiddleware, MentorProfileController.upsertProfile);

export { router as mentorProfileRoutes };
