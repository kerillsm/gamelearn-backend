import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { MentorProfileController } from "../controllers/mentorProfile.controller";
import { verifiedEmailMiddleware } from "../lib/middleware/verifiedEmailMiddleware";

const router = new Router();

router.get("/", MentorProfileController.getMentorProfiles);

router.get(
  "/me",
  authMiddleware,
  MentorProfileController.getCurrentUserProfile,
);

router.get("/filters-options", MentorProfileController.getFiltersOptions);

router.get("/:slug", MentorProfileController.getBySlug);

router.post(
  "/",
  authMiddleware,
  verifiedEmailMiddleware,
  MentorProfileController.upsertProfile,
);

export { router as mentorProfileRoutes };
