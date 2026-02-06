import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { TestimonialController } from "../controllers/testimonial.controller";

const router = new Router();

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
  TestimonialController.upsertTestimonial,
);

export { router as testimonialRoutes };
