import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { SessionController } from "../controllers/session.controller";

const router = new Router();

router.post("/", authMiddleware, SessionController.createSession);

export { router as sessionRoutes };
