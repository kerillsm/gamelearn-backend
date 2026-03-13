import Router from "koa-router";
import koaBody from "koa-body";
import { StorageController } from "../controllers/storage.controller";
import { authMiddleware } from "../lib/middleware/auth";
import { verifiedEmailMiddleware } from "../lib/middleware/verifiedEmailMiddleware";

const router = new Router();

router.post(
  "/upload",
  koaBody({ multipart: true }),
  authMiddleware,
  verifiedEmailMiddleware,
  StorageController.uploadFile,
);

export { router as storageRoutes };
