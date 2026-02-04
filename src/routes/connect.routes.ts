import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { ConnectController } from "../controllers/connect.controller";

const router = new Router();

router.post("/onboard", authMiddleware, ConnectController.startOnboarding);
router.get("/status", authMiddleware, ConnectController.getStatus);
router.get("/dashboard", authMiddleware, ConnectController.getDashboardLink);
router.get("/earnings", authMiddleware, ConnectController.getEarnings);
router.get("/payouts", authMiddleware, ConnectController.getPayoutHistory);

export { router as connectRoutes };
