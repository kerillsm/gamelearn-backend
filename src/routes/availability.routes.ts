import Router from "koa-router";
import { AvailabilityController } from "../controllers/availability.controller";
import { authMiddleware } from "../lib/middleware/auth";

const router = new Router();

router.post(
  "/rules",
  authMiddleware,
  AvailabilityController.updateAvailabilityRules,
);

router.get(
  "/rules",
  authMiddleware,
  AvailabilityController.getAvailabilityRules,
);

router.post(
  "/exception",
  authMiddleware,
  AvailabilityController.addAvailabilityException,
);

router.get(
  "/exceptions",
  authMiddleware,
  AvailabilityController.getAvailabilityExceptions,
);

router.delete(
  "/exception/:exceptionId",
  authMiddleware,
  AvailabilityController.removeAvailabilityException,
);

export { router as availabilityRoutes };
