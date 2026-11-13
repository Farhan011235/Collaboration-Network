import { Request, Response } from "express";
import * as taxonomyModel from "../models/taxonomy.model";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const getSkills = asyncHandler(async (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search) : undefined;
  const skills = await taxonomyModel.findSkills(search);
  return sendSuccess(res, { skills });
});

export const getInterests = asyncHandler(async (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search) : undefined;
  const interests = await taxonomyModel.findInterests(search);
  return sendSuccess(res, { interests });
});

export const getResearchDomains = asyncHandler(async (_req: Request, res: Response) => {
  const domains = await taxonomyModel.findResearchDomains();
  return sendSuccess(res, { domains });
});
