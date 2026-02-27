import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { ReferralController } from "../controllers/referral.controller";

const router = new Router();

router.get("/my-code", authMiddleware, ReferralController.getMyCode);
router.post("/generate", authMiddleware, ReferralController.generateCode);
router.post("/apply", authMiddleware, ReferralController.applyCode);

export { router as referralRoutes };
