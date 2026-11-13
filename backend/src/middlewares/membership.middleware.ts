import { Request, Response, NextFunction } from "express";
import * as workspaceModel from "../models/workspace.model";
import { ApiError } from "../utils/apiError";

// Confirms the signed-in user is a MEMBER of the project in :projectId.
// The owner counts as a member (they hold an OWNER membership row), so this
// gates the whole project workspace. Runs after authenticate.
export const requireProjectMember = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId) || projectId < 1) {
      return next(ApiError.badRequest("Invalid project id"));
    }

    const membership = await workspaceModel.findProjectMembership(
      projectId,
      req.user!.userId
    );

    if (!membership) {
      return next(
        ApiError.forbidden("You must be a member of this project")
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
