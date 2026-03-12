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
router.get(
  "/incomes-history",
  authMiddleware,
  FinanceController.getIncomesHistory,
);

export { router as financeRoutes };
