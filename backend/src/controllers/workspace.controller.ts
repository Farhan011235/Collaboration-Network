import { Request, Response } from "express";
import * as workspaceModel from "../models/workspace.model";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

// CONTROLLER LAYER - never imports prisma directly.

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid project id");
  }
  return id;
};

// Projects the signed-in user has joined (is a member of, not the owner).
export const getJoinedProjects = asyncHandler(
  async (req: Request, res: Response) => {
    const projects = await workspaceModel.findJoinedProjects(req.user!.userId);
    return sendSuccess(res, { projects });
  }
);

// The team roster - used to fill the "assign to" dropdown.
// Membership enforced by requireProjectMember on the route.
export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.projectId);
  const members = await workspaceModel.findMembers(projectId);
  return sendSuccess(res, { members });
});

// Completion snapshot for the progress bar.
export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.projectId);

  const [tasks, milestones] = await Promise.all([
    workspaceModel.getTaskStatusCounts(projectId),
    workspaceModel.getMilestoneCounts(projectId),
  ]);

  const totalTasks = tasks.TODO + tasks.IN_PROGRESS + tasks.DONE;
  const completionPercent =
    totalTasks === 0 ? 0 : Math.round((tasks.DONE / totalTasks) * 100);

  return sendSuccess(res, {
    overview: {
      tasks,
      totalTasks,
      completionPercent,
      milestones,
    },
  });
});
