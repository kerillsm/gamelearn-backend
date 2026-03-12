import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { SessionPackageController } from "../controllers/sessionPackage.controller";

const router = new Router();

router.get(
  "/next-session",
  authMiddleware,
  SessionPackageController.getNextSession,
);
router.get(
  "/my-packages",
  authMiddleware,
  SessionPackageController.getMySessionPackages,
);
router.get(
  "/mentor-packages",
  authMiddleware,
  SessionPackageController.getMentorSessionPackages,
);

router.get(
  "/admin/disputes",
  authMiddleware,
  SessionPackageController.getDisputeSessionPackages,
);

router.post("/", authMiddleware, SessionPackageController.createSessionPackage);

router.get(
  "/vibe-check/:mentorSlug",
  authMiddleware,
  SessionPackageController.hasVibeCheckSession,
);

router.post(
  "/cancel-pending",
  authMiddleware,
  SessionPackageController.cancelPendingSessionPackage,
);

router.post(
  "/:sessionPackageId/approve",
  authMiddleware,
  SessionPackageController.approveSessionPackage,
);

router.post(
  "/:sessionPackageId/reject",
  authMiddleware,
  SessionPackageController.rejectSessionPackage,
);

router.post(
  "/:sessionPackageId/cancel",
  authMiddleware,
  SessionPackageController.cancelSessionPackage,
);

router.post(
  "/:sessionPackageId/dispute",
  authMiddleware,
  SessionPackageController.createDisputeSessionPackage,
);

router.post(
  "/:sessionPackageId/resolve-dispute",
  authMiddleware,
  SessionPackageController.resolveDisputeSessionPackage,
);

router.post(
  "/:sessionPackageId/refund-dispute",
  authMiddleware,
  SessionPackageController.refundDisputeSessionPackage,
);

export { router as sessionPackageRoutes };
