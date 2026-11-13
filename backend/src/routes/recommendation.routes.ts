import { Router } from "express";
import * as recommendationController from "../controllers/recommendation.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Personalised list of published projects for the signed-in researcher.
router.get("/", authenticate, recommendationController.getRecommendations);

export default router;
