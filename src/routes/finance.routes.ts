import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { FinanceController } from "../controllers/finance.controller";

const router = new Router();

router.get("/balance", authMiddleware, FinanceController.getBalance);
router.get(
  "/payment-history",
  authMiddleware,
  FinanceController.getPaymentHistory,
);

export { router as financeRoutes };
