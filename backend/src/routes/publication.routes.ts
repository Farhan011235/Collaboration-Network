import { Router } from "express";
import * as publicationController from "../controllers/publication.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Literal route first so "search" is never read as an id.
router.get("/search", authenticate, publicationController.searchPublications);
router.get("/:id", authenticate, publicationController.getPublication);

export default router;
