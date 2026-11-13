import { Request, Response } from "express";
import * as recommendationService from "../services/recommendation.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// CONTROLLER LAYER - Project Recommendation System (Module 3 Feature 2).

export const getRecommendations = asyncHandler(
  async (req: Request, res: Response) => {
    const projects = await recommendationService.recommend(req.user!.userId);
    return sendSuccess(res, { projects });
  }
);
