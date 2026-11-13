import { Router } from "express";
import * as taskController from "../controllers/task.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectMember } from "../middlewares/membership.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../validators/task.validator";

const router = Router();

// Project-scoped: ":projectId" gates on membership.
router.get(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  taskController.listTasks
);

router.post(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  validate(createTaskSchema),
  taskController.createTask
);

// Resource-scoped: ":id" is a task id; membership is checked in the controller.
// The status route is declared before "/:id" for clarity.
router.patch(
  "/:id/status",
  authenticate,
  validate(updateTaskStatusSchema),
  taskController.updateTaskStatus
);

router.patch(
  "/:id",
  authenticate,
  validate(updateTaskSchema),
  taskController.updateTask
);

router.delete("/:id", authenticate, taskController.deleteTask);

export default router;
