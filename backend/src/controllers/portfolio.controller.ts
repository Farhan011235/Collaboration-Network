import { Request, Response } from "express";
import * as portfolioModel from "../models/portfolio.model";
import * as userModel from "../models/user.model";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  AddInterestInput,
  AddSkillInput,
  EducationInput,
  ExperienceInput,
  ImportPublicationInput,
  PublicationInput,
  UpdateProfileInput,
} from "../validators/portfolio.validator";

// CONTROLLER LAYER - Research Portfolio Management (Module 1 Feature 4).

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// Empty strings from a form mean "clear this field".
const orNull = (v?: string) => (v && v.trim() ? v.trim() : null);

// Shared guard for the row-owned sections: you may only edit your own entries.
const assertOwns = (
  row: { userId: number } | null,
  userId: number,
  label: string
) => {
  if (!row) throw ApiError.notFound(`${label} not found`);
  if (row.userId !== userId) {
    throw ApiError.forbidden(`You can only change your own ${label.toLowerCase()}`);
  }
};

/* ---------- read ---------- */

export const getMyPortfolio = asyncHandler(
  async (req: Request, res: Response) => {
    const portfolio = await portfolioModel.findPortfolio(req.user!.userId);
    if (!portfolio) throw ApiError.notFound("Portfolio not found");
    return sendSuccess(res, { portfolio });
  }
);

// Anyone signed in can view another researcher's portfolio.
export const getUserPortfolio = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = parseId(req.params.userId);
    const portfolio = await portfolioModel.findPortfolio(userId);
    if (!portfolio) throw ApiError.notFound("Researcher not found");
    return sendSuccess(res, { portfolio });
  }
);

/* ---------- profile ---------- */

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as UpdateProfileInput;

    const user = await userModel.updateProfile(req.user!.userId, {
      ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
      ...(body.bio !== undefined ? { bio: orNull(body.bio) } : {}),
      ...(body.institution !== undefined
        ? { institution: orNull(body.institution) }
        : {}),
      ...(body.designation !== undefined
        ? { designation: orNull(body.designation) }
        : {}),
      ...(body.orcidId !== undefined ? { orcidId: orNull(body.orcidId) } : {}),
      ...(body.websiteUrl !== undefined
        ? { websiteUrl: orNull(body.websiteUrl) }
        : {}),
      ...(body.openToCollaboration !== undefined
        ? { openToCollaboration: body.openToCollaboration }
        : {}),
    });

    return sendSuccess(res, { user }, "Profile updated");
  }
);

/* ---------- skills ---------- */

export const addSkill = asyncHandler(async (req: Request, res: Response) => {
  const { skillId, proficiencyLevel } = req.body as AddSkillInput;

  if (!(await portfolioModel.skillExists(skillId))) {
    throw ApiError.badRequest("That skill does not exist");
  }

  const skill = await portfolioModel.addSkill(
    req.user!.userId,
    skillId,
    proficiencyLevel
  );
  return sendSuccess(res, { skill }, "Skill saved", 201);
});

export const removeSkill = asyncHandler(async (req: Request, res: Response) => {
  const skillId = parseId(req.params.skillId);
  await portfolioModel
    .removeSkill(req.user!.userId, skillId)
    .catch(() => {
      throw ApiError.notFound("That skill is not on your portfolio");
    });
  return sendSuccess(res, { skillId }, "Skill removed");
});

/* ---------- interests ---------- */

export const addInterest = asyncHandler(async (req: Request, res: Response) => {
  const { interestId } = req.body as AddInterestInput;

  if (!(await portfolioModel.interestExists(interestId))) {
    throw ApiError.badRequest("That interest does not exist");
  }

  const interest = await portfolioModel.addInterest(
    req.user!.userId,
    interestId
  );
  return sendSuccess(res, { interest }, "Interest added", 201);
});

export const removeInterest = asyncHandler(
  async (req: Request, res: Response) => {
    const interestId = parseId(req.params.interestId);
    await portfolioModel
      .removeInterest(req.user!.userId, interestId)
      .catch(() => {
        throw ApiError.notFound("That interest is not on your portfolio");
      });
    return sendSuccess(res, { interestId }, "Interest removed");
  }
);

/* ---------- education ---------- */

export const addEducation = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as EducationInput;
  const education = await portfolioModel.createEducation(req.user!.userId, {
    degree: body.degree,
    fieldOfStudy: body.fieldOfStudy,
    institution: body.institution,
    startYear: body.startYear ?? null,
    endYear: body.endYear ?? null,
  });
  return sendSuccess(res, { education }, "Education added", 201);
});

export const updateEducation = asyncHandler(
  async (req: Request, res: Response) => {
    const educationId = parseId(req.params.id);
    const row = await portfolioModel.findEducationOwner(educationId);
    assertOwns(row, req.user!.userId, "Education entry");

    const education = await portfolioModel.updateEducation(
      educationId,
      req.body
    );
    return sendSuccess(res, { education }, "Education updated");
  }
);

export const deleteEducation = asyncHandler(
  async (req: Request, res: Response) => {
    const educationId = parseId(req.params.id);
    const row = await portfolioModel.findEducationOwner(educationId);
    assertOwns(row, req.user!.userId, "Education entry");

    await portfolioModel.deleteEducation(educationId);
    return sendSuccess(res, { educationId }, "Education removed");
  }
);

/* ---------- publications ---------- */

export const addPublication = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as PublicationInput;
    const publication = await portfolioModel.createPublication(
      req.user!.userId,
      {
        title: body.title,
        authors: orNull(body.authors),
        venue: orNull(body.venue),
        doi: orNull(body.doi),
        year: body.year ?? null,
        citationCount: body.citationCount ?? 0,
        sourceApi: "manual",
      }
    );
    return sendSuccess(res, { publication }, "Publication added", 201);
  }
);

// Saves a work found through the OpenAlex search (Module 3 Feature 5) so
// researchers don't have to retype its metadata.
export const importPublication = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as ImportPublicationInput;
    const userId = req.user!.userId;

    const existing = await portfolioModel.findPublicationByExternalId(
      userId,
      body.openAlexId
    );
    if (existing) {
      throw ApiError.conflict("That publication is already on your portfolio");
    }

    const publication = await portfolioModel.createPublication(userId, {
      title: body.title,
      authors: orNull(body.authors),
      venue: orNull(body.venue),
      doi: orNull(body.doi),
      year: body.year ?? null,
      citationCount: body.citationCount ?? 0,
      externalId: body.openAlexId,
      sourceApi: "openalex",
    });

    return sendSuccess(res, { publication }, "Added to your portfolio", 201);
  }
);

export const updatePublication = asyncHandler(
  async (req: Request, res: Response) => {
    const publicationId = parseId(req.params.id);
    const row = await portfolioModel.findPublicationOwner(publicationId);
    assertOwns(row, req.user!.userId, "Publication");

    const publication = await portfolioModel.updatePublication(
      publicationId,
      req.body
    );
    return sendSuccess(res, { publication }, "Publication updated");
  }
);

export const deletePublication = asyncHandler(
  async (req: Request, res: Response) => {
    const publicationId = parseId(req.params.id);
    const row = await portfolioModel.findPublicationOwner(publicationId);
    assertOwns(row, req.user!.userId, "Publication");

    await portfolioModel.deletePublication(publicationId);
    return sendSuccess(res, { publicationId }, "Publication removed");
  }
);

/* ---------- previous project experience ---------- */

export const addExperience = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as ExperienceInput;
    const experience = await portfolioModel.createExperience(req.user!.userId, {
      title: body.title,
      description: orNull(body.description),
      role: orNull(body.role),
      organization: orNull(body.organization),
      startYear: body.startYear ?? null,
      endYear: body.endYear ?? null,
    });
    return sendSuccess(res, { experience }, "Experience added", 201);
  }
);

export const updateExperience = asyncHandler(
  async (req: Request, res: Response) => {
    const experienceId = parseId(req.params.id);
    const row = await portfolioModel.findExperienceOwner(experienceId);
    assertOwns(row, req.user!.userId, "Experience");

    const experience = await portfolioModel.updateExperience(
      experienceId,
      req.body
    );
    return sendSuccess(res, { experience }, "Experience updated");
  }
);

export const deleteExperience = asyncHandler(
  async (req: Request, res: Response) => {
    const experienceId = parseId(req.params.id);
    const row = await portfolioModel.findExperienceOwner(experienceId);
    assertOwns(row, req.user!.userId, "Experience");

    await portfolioModel.deleteExperience(experienceId);
    return sendSuccess(res, { experienceId }, "Experience removed");
  }
);
