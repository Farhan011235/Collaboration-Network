import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectOwner } from "../middlewares/ownership.middleware";

const router = Router();

// ":id" is a PROJECT id - only its owner may generate a report.
router.get(
  "/project/:id/preview",
  authenticate,
  requireProjectOwner,
  reportController.getReportPreview
);

router.get(
  "/project/:id/pdf",
  authenticate,
  requireProjectOwner,
  reportController.downloadReportPdf
);

export default router;
