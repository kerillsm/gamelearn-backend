import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { UserController } from "../controllers/user.controller";

const router = new Router();

router.get("/me", authMiddleware, UserController.getCurrentUser);

export { router as userRoutes };
