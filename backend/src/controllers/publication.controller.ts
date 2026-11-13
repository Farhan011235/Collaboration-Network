import { Request, Response } from "express";
import * as openAlexService from "../services/openalex.service";
import { searchPublicationSchema } from "../validators/publication.validator";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

// CONTROLLER LAYER - Academic Publication Search (Module 3 Feature 5).

export const searchPublications = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = searchPublicationSchema.safeParse(req.query);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        fieldErrors[e.path.join(".")] = e.message;
      });
      throw ApiError.badRequest("Check your search filters", fieldErrors);
    }

    const result = await openAlexService.searchPublications(parsed.data);
    return sendSuccess(res, result);
  }
);

export const getPublication = asyncHandler(
  async (req: Request, res: Response) => {
    // OpenAlex work ids look like "W2741809807".
    const id = String(req.params.id || "");
    if (!/^W\d+$/i.test(id)) {
      throw ApiError.badRequest("Invalid publication id");
    }

    const publication = await openAlexService.getPublication(id);
    return sendSuccess(res, { publication });
  }
);
