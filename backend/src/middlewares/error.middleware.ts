import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError";
import { sendError } from "../utils/apiResponse";
import { env } from "../config/env";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (env.nodeEnv === "development") {
    console.error(err);
  }

  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // Prisma: unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, "That value is already taken", 409);
    }
    if (err.code === "P2025") {
      return sendError(res, "Record not found", 404);
    }
  }

  return sendError(res, "Something went wrong on our end", 500);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};
