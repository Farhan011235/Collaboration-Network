import { Request, Response } from "express";
import * as analyticsService from "../services/analytics.service";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

// CONTROLLER LAYER - Project Analytics Dashboard (Module 3 Feature 4).

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// Membership is enforced by requireProjectMember on the route.
export const getProjectAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId);
    const analytics = await analyticsService.buildProjectAnalytics(projectId);
    return sendSuccess(res, { analytics });
  }
);
