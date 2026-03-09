import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { adminMiddleware } from "../lib/middleware/adminMiddleware";
import { ConnectController } from "../controllers/connect.controller";

const router = new Router();

router.post("/onboard", authMiddleware, ConnectController.startOnboarding);
router.get("/status", authMiddleware, ConnectController.getStatus);
router.get("/earnings", authMiddleware, ConnectController.getEarnings);
router.post(
  "/platform-payout",
  authMiddleware,
  adminMiddleware,
  ConnectController.requestPlatformPayout,
);

export { router as connectRoutes };
