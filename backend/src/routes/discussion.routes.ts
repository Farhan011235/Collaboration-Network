import { Router } from "express";
import * as discussionController from "../controllers/discussion.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectMember } from "../middlewares/membership.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createThreadSchema,
  createCommentSchema,
} from "../validators/discussion.validator";

const router = Router();

// Project-scoped: ":projectId" gates on membership.
router.get(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  discussionController.listThreads
);

router.post(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  validate(createThreadSchema),
  discussionController.createThread
);

// Thread-scoped: membership is re-checked inside the controller.
router.get("/thread/:id", authenticate, discussionController.getThread);

router.post(
  "/thread/:id/comments",
  authenticate,
  validate(createCommentSchema),
  discussionController.createComment
);

router.delete("/thread/:id", authenticate, discussionController.deleteThread);
router.delete("/comment/:id", authenticate, discussionController.deleteComment);

export default router;
