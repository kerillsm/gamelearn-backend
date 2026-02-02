import Router from "koa-router";
import { PaymentController } from "../controllers/payment.controller";

const router = new Router();

// Stripe webhook - no auth required, uses signature verification
router.post("/webhook", PaymentController.handleWebhook);

export { router as paymentRoutes };
