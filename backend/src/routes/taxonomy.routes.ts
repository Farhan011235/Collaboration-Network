import { Router } from "express";
import * as taxonomyController from "../controllers/taxonomy.controller";

const router = Router();

// Public reference data - no auth needed.
router.get("/skills", taxonomyController.getSkills);
router.get("/interests", taxonomyController.getInterests);
router.get("/domains", taxonomyController.getResearchDomains);

export default router;
