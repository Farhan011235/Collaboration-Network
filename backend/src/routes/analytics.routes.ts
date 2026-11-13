import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectMember } from "../middlewares/membership.middleware";

const router = Router();

// Project-scoped: ":projectId" gates on membership.
router.get(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  analyticsController.getProjectAnalytics
);

export default router;
