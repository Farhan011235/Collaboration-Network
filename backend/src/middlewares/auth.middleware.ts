import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";

// Reads the Bearer token, verifies it, and attaches req.user.
// Any route placed after this middleware is protected.
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Sign in to continue"));
  }

  const token = header.split(" ")[1];

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(ApiError.unauthorized("Your session expired. Sign in again."));
  }
};
