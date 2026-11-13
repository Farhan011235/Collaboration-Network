import { Router } from "express";
import * as applicationController from "../controllers/application.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectOwner } from "../middlewares/ownership.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createApplicationSchema,
  reviewApplicationSchema,
} from "../validators/application.validator";

const router = Router();

// The applicant's own outgoing requests. Must come before any "/:id".
router.get("/mine", authenticate, applicationController.getMyApplications);

// Owner-side review & team formation (Fahad - Feature 3).
// ":id" here is a PROJECT id, so requireProjectOwner applies.
router.get(
  "/project/:id",
  authenticate,
  requireProjectOwner,
  applicationController.getProjectApplications
);

// ":id" here is an APPLICATION id, so ownership is checked in the controller.
router.patch(
  "/:id/review",
  authenticate,
  validate(reviewApplicationSchema),
  applicationController.reviewApplication
);

// Request to collaborate (Zunaid - Feature 2).
router.post(
  "/",
  authenticate,
  validate(createApplicationSchema),
  applicationController.applyToProject
);

export default router;
