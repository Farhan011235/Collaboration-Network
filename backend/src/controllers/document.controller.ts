import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import * as documentModel from "../models/document.model";
import * as workspaceModel from "../models/workspace.model";
import { UPLOAD_DIR } from "../middlewares/upload.middleware";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "../validators/document.validator";

// CONTROLLER LAYER - never imports prisma directly.

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// Best-effort removal of a stored file; a missing file is not an error.
const deleteFile = (fileName: string) => {
  fs.promises.unlink(path.join(UPLOAD_DIR, fileName)).catch(() => {});
};

// Loads a document and confirms the caller is a member of its project.
const loadDocumentForMember = async (documentId: number, userId: number) => {
  const document = await documentModel.findById(documentId);
  if (!document) {
    throw ApiError.notFound("Document not found");
  }
  const membership = await workspaceModel.findProjectMembership(
    document.projectId,
    userId
  );
  if (!membership) {
    throw ApiError.forbidden("You must be a member of this project");
  }
  return document;
};

// Project membership enforced by requireProjectMember on the route.
export const listDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId);
    const documents = await documentModel.findByProject(projectId);
    return sendSuccess(res, { documents });
  }
);

export const uploadDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId);
    const body = req.body as CreateDocumentInput;

    if (!req.file) {
      throw ApiError.badRequest("Attach a file to upload");
    }

    const document = await documentModel.create({
      projectId,
      uploaderId: req.user!.userId,
      title: body.title,
      description: body.description || null,
      category: body.category || null,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    return sendSuccess(res, { document }, "Document uploaded", 201);
  }
);

// Update metadata and/or replace the file with a new version.
export const updateDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = parseId(req.params.id);
    const existing = await loadDocumentForMember(documentId, req.user!.userId);

    const body = req.body as UpdateDocumentInput;

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined)
      data.description = body.description || null;
    if (body.category !== undefined) data.category = body.category || null;

    // A new file replaces the old one and bumps the version.
    if (req.file) {
      deleteFile(existing.fileName);
      data.fileName = req.file.filename;
      data.originalName = req.file.originalname;
      data.mimeType = req.file.mimetype;
      data.sizeBytes = req.file.size;
      data.version = existing.version + 1;
    }

    const document = await documentModel.update(documentId, data);
    return sendSuccess(res, { document }, "Document updated");
  }
);

export const downloadDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = parseId(req.params.id);
    const document = await loadDocumentForMember(documentId, req.user!.userId);

    const filePath = path.join(UPLOAD_DIR, document.fileName);
    if (!fs.existsSync(filePath)) {
      throw ApiError.notFound("The file is no longer available");
    }

    // Streams the file back with its original name.
    return res.download(filePath, document.originalName);
  }
);

export const deleteDocument = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = parseId(req.params.id);
    const document = await loadDocumentForMember(documentId, req.user!.userId);

    // Only the person who uploaded it can remove it.
    if (document.uploaderId !== req.user!.userId) {
      throw ApiError.forbidden("You can only delete documents you uploaded");
    }

    deleteFile(document.fileName);
    await documentModel.remove(documentId);

    return sendSuccess(res, { documentId }, "Document deleted");
  }
);
