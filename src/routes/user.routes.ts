import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { UserController } from "../controllers/user.controller";

const router = new Router();

router.get("/me", authMiddleware, UserController.getCurrentUser);

router.put("/me", authMiddleware, UserController.updateCurrentUser);

router.post("/me/accept-terms", authMiddleware, UserController.acceptTerms);

export { router as userRoutes };
