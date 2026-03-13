import Router from "koa-router";
import { authMiddleware } from "../lib/middleware/auth";
import { SessionPackageController } from "../controllers/sessionPackage.controller";
import { verifiedEmailMiddleware } from "../lib/middleware/verifiedEmailMiddleware";

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

router.post(
  "/",
  authMiddleware,
  verifiedEmailMiddleware,
  SessionPackageController.createSessionPackage,
);

router.get(
  "/vibe-check/:mentorSlug",
  authMiddleware,
  SessionPackageController.hasVibeCheckSession,
);

router.post(
  "/cancel-pending",
  authMiddleware,
  verifiedEmailMiddleware,
  SessionPackageController.cancelPendingSessionPackage,
);

router.post(
  "/:sessionPackageId/approve",
  authMiddleware,
  verifiedEmailMiddleware,
  SessionPackageController.approveSessionPackage,
);

router.post(
  "/:sessionPackageId/reject",
  authMiddleware,
  verifiedEmailMiddleware,
  SessionPackageController.rejectSessionPackage,
);

router.post(
  "/:sessionPackageId/cancel",
  authMiddleware,
  verifiedEmailMiddleware,
  SessionPackageController.cancelSessionPackage,
);

router.post(
  "/:sessionPackageId/dispute",
  authMiddleware,
  verifiedEmailMiddleware,
  SessionPackageController.createDisputeSessionPackage,
);

router.post(
  "/:sessionPackageId/resolve-dispute",
  authMiddleware,
  verifiedEmailMiddleware,
  SessionPackageController.resolveDisputeSessionPackage,
);

router.post(
  "/:sessionPackageId/refund-dispute",
  authMiddleware,
  verifiedEmailMiddleware,
  SessionPackageController.refundDisputeSessionPackage,
);

export { router as sessionPackageRoutes };
