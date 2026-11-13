import { Router } from "express";
import * as milestoneController from "../controllers/milestone.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectMember } from "../middlewares/membership.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createMilestoneSchema,
  updateMilestoneSchema,
} from "../validators/milestone.validator";

const router = Router();

// Project-scoped: ":projectId" gates on membership.
router.get(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  milestoneController.listMilestones
);

router.post(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  validate(createMilestoneSchema),
  milestoneController.createMilestone
);

// Resource-scoped: ":id" is a milestone id, so membership is checked in the
// controller after loading the milestone.
router.patch(
  "/:id",
  authenticate,
  validate(updateMilestoneSchema),
  milestoneController.updateMilestone
);

router.delete("/:id", authenticate, milestoneController.deleteMilestone);

export default router;
