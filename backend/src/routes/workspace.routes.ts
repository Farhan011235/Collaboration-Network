import { Router } from "express";
import * as workspaceController from "../controllers/workspace.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectMember } from "../middlewares/membership.middleware";

const router = Router();

// "Projects I'm on" - the user's own membership list, no project param.
router.get("/joined", authenticate, workspaceController.getJoinedProjects);

// Project-scoped workspace data (team roster + completion overview).
router.get(
  "/project/:projectId/members",
  authenticate,
  requireProjectMember,
  workspaceController.getMembers
);

router.get(
  "/project/:projectId/overview",
  authenticate,
  requireProjectMember,
  workspaceController.getOverview
);

export default router;
