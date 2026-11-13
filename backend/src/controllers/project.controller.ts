import { Request, Response } from "express";
import { ProjectStatus } from "@prisma/client";
import * as projectModel from "../models/project.model";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { assertTransitionAllowed, canView } from "../services/projectStatus.service";
import {
  CreateProjectInput,
  UpdateProjectInput,
  searchProjectSchema,
} from "../validators/project.validator";

// CONTROLLER LAYER - never imports prisma directly.

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid project id");
  }
  return id;
};

// Rejects skill ids that do not exist, so we fail with a clear message
// instead of a foreign-key error from the database.
const assertSkillsExist = async (skills?: { skillId: number }[]) => {
  if (!skills || skills.length === 0) return;
  const ids = skills.map((s) => s.skillId);
  const found = await projectModel.countSkillsById(ids);
  if (found !== new Set(ids).size) {
    throw ApiError.badRequest("One or more selected skills no longer exist");
  }
};

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateProjectInput;

  await assertSkillsExist(data.skills);

  const project = await projectModel.createProject(req.user!.userId, data);

  return sendSuccess(res, { project }, "Draft saved", 201);
});

export const getMyProjects = asyncHandler(async (req: Request, res: Response) => {
  const statusParam = String(req.query.status || "").toUpperCase();
  const status =
    statusParam && statusParam in ProjectStatus
      ? (statusParam as ProjectStatus)
      : undefined;

  const projects = await projectModel.findByOwner(req.user!.userId, status);

  return sendSuccess(res, { projects });
});

// Public discovery over published proposals, with keyword + filters.
// Filters come in as query params, so we parse them here rather than
// through the body-focused validate middleware.
export const searchProjects = asyncHandler(async (req: Request, res: Response) => {
  const parsed = searchProjectSchema.safeParse(req.query);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((e) => {
      fieldErrors[e.path.join(".")] = e.message;
    });
    throw ApiError.badRequest("Check your search filters", fieldErrors);
  }

  const result = await projectModel.searchProjects(parsed.data, req.user!.userId);

  return sendSuccess(res, result);
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.id);
  const project = await projectModel.findById(projectId);

  if (!project) {
    throw ApiError.notFound("Project not found");
  }

  if (!canView(project.status, project.ownerId, req.user?.userId)) {
    throw ApiError.notFound("Project not found");
  }

  return sendSuccess(res, { project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.id);
  const data = req.body as UpdateProjectInput;

  await assertSkillsExist(data.skills);

  const project = await projectModel.updateProject(projectId, data);

  return sendSuccess(res, { project }, "Changes saved");
});

// Shared handler for publish / archive / reopen.
const changeStatus = (target: ProjectStatus, message: string) =>
  asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.params.id);

    const current = await projectModel.findOwnerAndStatus(projectId);
    if (!current) {
      throw ApiError.notFound("Project not found");
    }

    assertTransitionAllowed(current.status, target);

    const project = await projectModel.updateStatus(
      projectId,
      target,
      target === ProjectStatus.PUBLISHED ? new Date() : undefined
    );

    return sendSuccess(res, { project }, message);
  });

export const publishProject = changeStatus(ProjectStatus.PUBLISHED, "Published");
export const archiveProject = changeStatus(ProjectStatus.ARCHIVED, "Archived");
export const reopenProject = changeStatus(ProjectStatus.PUBLISHED, "Reopened");

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.id);

  const current = await projectModel.findOwnerAndStatus(projectId);
  if (!current) {
    throw ApiError.notFound("Project not found");
  }

  // Once a proposal is public, people may have applied to it.
  // Archiving keeps that history; deleting would destroy it.
  if (current.status !== ProjectStatus.DRAFT) {
    throw ApiError.badRequest(
      "Only drafts can be deleted. Archive the project instead."
    );
  }

  await projectModel.deleteProject(projectId);

  return sendSuccess(res, { projectId }, "Draft deleted");
});
