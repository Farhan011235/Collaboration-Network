import { Router } from "express";
import * as documentController from "../controllers/document.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireProjectMember } from "../middlewares/membership.middleware";
import { uploadSingle } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createDocumentSchema,
  updateDocumentSchema,
} from "../validators/document.validator";

const router = Router();

// Project-scoped: ":projectId" gates on membership.
router.get(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  documentController.listDocuments
);

// Upload: multer parses the multipart body first, then zod checks the fields.
router.post(
  "/project/:projectId",
  authenticate,
  requireProjectMember,
  uploadSingle("file"),
  validate(createDocumentSchema),
  documentController.uploadDocument
);

// Document-scoped: membership re-checked in the controller.
router.get(
  "/:id/download",
  authenticate,
  documentController.downloadDocument
);

router.patch(
  "/:id",
  authenticate,
  uploadSingle("file"),
  validate(updateDocumentSchema),
  documentController.updateDocument
);

router.delete("/:id", authenticate, documentController.deleteDocument);

export default router;
