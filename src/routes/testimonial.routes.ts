import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { TestimonialController } from "../controllers/testimonial.controller";
import { verifiedEmailMiddleware } from "../lib/middleware/verifiedEmailMiddleware";

const router = new Router();

router.get(
  "/admin/pending",
  authMiddleware,
  TestimonialController.getAdminPendingTestimonials,
);

router.get(
  "/pending-mentor-profiles",
  authMiddleware,
  TestimonialController.getPendingTestimonialsMentorProfiles,
);

router.get(
  "/user/all",
  authMiddleware,
  TestimonialController.getUserTestimonials,
);

router.get("/latest", TestimonialController.getLatestTestimonials);

router.get(
  "/user/:slug",
  authMiddleware,
  TestimonialController.getUserTestimonialBySlug,
);

router.post(
  "/upsert/:slug",
  authMiddleware,
  verifiedEmailMiddleware,
  TestimonialController.upsertTestimonial,
);

router.get("/mentor/:slug", TestimonialController.getMentorTestimonials);

router.post(
  "/:id/approve",
  authMiddleware,
  verifiedEmailMiddleware,
  TestimonialController.approveTestimonial,
);

router.post(
  "/:id/reject",
  authMiddleware,
  verifiedEmailMiddleware,
  TestimonialController.rejectTestimonial,
);

export { router as testimonialRoutes };
