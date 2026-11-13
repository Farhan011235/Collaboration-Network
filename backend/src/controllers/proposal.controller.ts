import { Request, Response } from "express";
import * as projectModel from "../models/project.model";
import * as proposalService from "../services/proposalAssistant.service";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

// CONTROLLER LAYER - Proposal Quality Assistant (Module 3 Feature 3).

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// Whether the Gemini key is set, so the UI can show/hide the feature.
export const getStatus = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, { configured: proposalService.isGeminiConfigured() });
});

// Owner-only (requireProjectOwner on the route). Runs the proposal through
// Gemini and returns clarity/completeness/structure feedback.
export const analyze = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.id);

  const project = await projectModel.findById(projectId);
  if (!project) {
    throw ApiError.notFound("Project not found");
  }

  const analysis = await proposalService.analyzeProposal({
    title: project.title,
    description: project.description,
    objectives: project.objectives,
    expectedOutcomes: project.expectedOutcomes,
    researchDomain: project.researchDomain,
    collaborationType: project.collaborationType,
    durationMonths: project.durationMonths,
    skills: project.skillRequirements.map((r) => r.skill.name),
  });

  return sendSuccess(res, { analysis });
});
