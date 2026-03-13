import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { adminMiddleware } from "../lib/middleware/adminMiddleware";
import { NewsletterController } from "../controllers/newsletter.controller";
import { verifiedEmailMiddleware } from "../lib/middleware/verifiedEmailMiddleware";

const router = new Router();

router.post(
  "/subscribe",
  authMiddleware,
  verifiedEmailMiddleware,
  NewsletterController.subscribe,
);

router.get(
  "/status",
  authMiddleware,
  NewsletterController.getSubscriptionStatus,
);

router.get("/unsubscribe", NewsletterController.unsubscribe);

router.get(
  "/subscribers-count",
  authMiddleware,
  adminMiddleware,
  NewsletterController.getSubscribersCount,
);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  NewsletterController.createNewsletter,
);

export { router as newsletterRoutes };
