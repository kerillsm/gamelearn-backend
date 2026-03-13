import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { ReferralController } from "../controllers/referral.controller";
import { verifiedEmailMiddleware } from "../lib/middleware/verifiedEmailMiddleware";

const router = new Router();

router.get("/my-code", authMiddleware, ReferralController.getMyCode);
router.post(
  "/generate",
  authMiddleware,
  verifiedEmailMiddleware,
  ReferralController.generateCode,
);
router.post(
  "/apply",
  authMiddleware,
  verifiedEmailMiddleware,
  ReferralController.applyCode,
);

export { router as referralRoutes };
