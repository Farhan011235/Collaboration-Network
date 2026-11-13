import { Request, Response, NextFunction } from "express";
import * as projectModel from "../models/project.model";
import { ApiError } from "../utils/apiError";

// Confirms the signed-in user owns the project in :id.
// Runs after authenticate, so req.user is guaranteed.
export const requireProjectOwner = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId < 1) {
      return next(ApiError.badRequest("Invalid project id"));
    }

    const project = await projectModel.findOwnerAndStatus(projectId);

    if (!project) {
      return next(ApiError.notFound("Project not found"));
    }

    if (project.ownerId !== req.user!.userId) {
      return next(ApiError.forbidden("Only the project owner can do this"));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
