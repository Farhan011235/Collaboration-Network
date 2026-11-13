import { Router } from "express";
import * as teamController from "../controllers/team.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectMember } from "../middlewares/membership.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  updateEvaluationSchema,
  updateRoleSchema,
} from "../validators/team.validator";

const router = Router();

// Any member can see the roster; ownership for the write routes is checked
// inside the controller (the param is :projectId, not :id).
router.get(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  teamController.getTeam
);

router.patch(
  "/project/:projectId/members/:userId",
  authenticate,
  requireProjectMember,
  validate(updateRoleSchema),
  teamController.updateMemberRole
);

router.patch(
  "/project/:projectId/members/:userId/evaluation",
  authenticate,
  requireProjectMember,
  validate(updateEvaluationSchema),
  teamController.updateMemberEvaluation
);

export default router;
