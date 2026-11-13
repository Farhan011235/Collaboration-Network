import { Router } from "express";
import * as proposalController from "../controllers/proposal.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectOwner } from "../middlewares/ownership.middleware";

const router = Router();

// Is the assistant available on this server?
router.get("/status", authenticate, proposalController.getStatus);

// Analyze one of my proposals. ":id" is a project id, gated by ownership.
router.post(
  "/:id/analyze",
  authenticate,
  requireProjectOwner,
  proposalController.analyze
);

export default router;
