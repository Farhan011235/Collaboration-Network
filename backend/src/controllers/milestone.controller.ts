import { Request, Response } from "express";
import * as milestoneModel from "../models/milestone.model";
import * as workspaceModel from "../models/workspace.model";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "../validators/milestone.validator";

// CONTROLLER LAYER - never imports prisma directly.

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// Any project member reaching a milestone by its id must be re-checked,
// because these routes are keyed by milestone id, not project id.
const assertMemberOfMilestoneProject = async (
  milestoneId: number,
  userId: number
) => {
  const milestone = await milestoneModel.findById(milestoneId);
  if (!milestone) {
    throw ApiError.notFound("Milestone not found");
  }
  const membership = await workspaceModel.findProjectMembership(
    milestone.projectId,
    userId
  );
  if (!membership) {
    throw ApiError.forbidden("You must be a member of this project");
  }
  return milestone;
};

// Project membership is enforced by requireProjectMember on the route.
export const listMilestones = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId);
    const milestones = await milestoneModel.findByProject(projectId);
    return sendSuccess(res, { milestones });
  }
);

export const createMilestone = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId);
    const body = req.body as CreateMilestoneInput;

    const milestone = await milestoneModel.create({
      projectId,
      title: body.title,
      description: body.description || null,
      dueDate: body.dueDate ?? null,
      status: body.status,
      orderIndex: body.orderIndex,
    });

    return sendSuccess(res, { milestone }, "Milestone added", 201);
  }
);

export const updateMilestone = asyncHandler(
  async (req: Request, res: Response) => {
    const milestoneId = parseId(req.params.id);
    await assertMemberOfMilestoneProject(milestoneId, req.user!.userId);

    const body = req.body as UpdateMilestoneInput;

    const milestone = await milestoneModel.update(milestoneId, {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined
        ? { description: body.description || null }
        : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate ?? null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.orderIndex !== undefined ? { orderIndex: body.orderIndex } : {}),
    });

    return sendSuccess(res, { milestone }, "Milestone updated");
  }
);

export const deleteMilestone = asyncHandler(
  async (req: Request, res: Response) => {
    const milestoneId = parseId(req.params.id);
    await assertMemberOfMilestoneProject(milestoneId, req.user!.userId);

    // Tasks keep existing; their milestoneId is set null by the DB relation.
    await milestoneModel.remove(milestoneId);

    return sendSuccess(res, { milestoneId }, "Milestone deleted");
  }
);
