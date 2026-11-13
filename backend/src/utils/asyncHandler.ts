import { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps async controllers so a rejected promise reaches the error
// middleware instead of crashing the server. Without this, every
// controller needs its own try/catch.
export const asyncHandler =
  (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
