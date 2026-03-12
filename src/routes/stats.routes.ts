import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { StatsController } from "../controllers/stats.controller";

const router = new Router();

router.get("/", authMiddleware, StatsController.getStats);

export { router as statsRoutes };
