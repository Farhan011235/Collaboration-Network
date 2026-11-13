import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodEffects, ZodError } from "zod";
import { ApiError } from "../utils/apiError";

// Validates req.body against a zod schema before the controller runs.
// Keeps validation logic out of controllers.
export const validate =
  (schema: AnyZodObject | ZodEffects<AnyZodObject>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          fieldErrors[e.path.join(".")] = e.message;
        });
        return next(ApiError.badRequest("Check the highlighted fields", fieldErrors));
      }
      return next(err);
    }
  };
