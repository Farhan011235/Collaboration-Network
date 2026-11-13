import { Router } from "express";
import * as projectController from "../controllers/project.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectOwner } from "../middlewares/ownership.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator";

const router = Router();

// Owner-only listing. Must come before "/:id" or Express would
// treat "mine" as an id.
router.get("/mine", authenticate, projectController.getMyProjects);

// Search & discovery over published proposals (Zunaid - Feature 2).
router.get("/", authenticate, projectController.searchProjects);

router.post(
  "/",
  authenticate,
  validate(createProjectSchema),
  projectController.createProject
);

router.get("/:id", authenticate, projectController.getProject);

router.patch(
  "/:id",
  authenticate,
  requireProjectOwner,
  validate(updateProjectSchema),
  projectController.updateProject
);

router.patch("/:id/publish", authenticate, requireProjectOwner, projectController.publishProject);
router.patch("/:id/archive", authenticate, requireProjectOwner, projectController.archiveProject);
router.patch("/:id/reopen", authenticate, requireProjectOwner, projectController.reopenProject);

router.delete("/:id", authenticate, requireProjectOwner, projectController.deleteProject);

export default router;
