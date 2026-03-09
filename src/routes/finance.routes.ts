import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { FinanceController } from "../controllers/finance.controller";

const router = new Router();

router.get("/balance", authMiddleware, FinanceController.getBalance);

export { router as financeRoutes };
