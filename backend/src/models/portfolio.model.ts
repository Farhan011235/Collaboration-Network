import prisma from "../config/prisma";
import { Prisma, ProficiencyLevel } from "@prisma/client";

// MODEL LAYER - all database access for the research portfolio
// (Module 1 Feature 4). The tables were already in the schema; this adds the
// queries that let researchers actually maintain them.

// Everything shown on a portfolio, newest-first within each section.
// (No `as const` here: it would make the orderBy arrays readonly, which
// Prisma's generated types reject.)
const portfolioInclude = {
  skills: { include: { skill: true } },
  interests: { include: { interest: true } },
  educations: { orderBy: [{ endYear: "desc" }, { startYear: "desc" }] },
  publications: { orderBy: [{ year: "desc" }, { createdAt: "desc" }] },
  projectExperiences: { orderBy: [{ endYear: "desc" }, { startYear: "desc" }] },
} satisfies Prisma.UserSelect;

export const findPortfolio = (userId: number) =>
  prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      fullName: true,
      email: true,
      bio: true,
      institution: true,
      designation: true,
      orcidId: true,
      websiteUrl: true,
      openToCollaboration: true,
      profilePictureUrl: true,
      createdAt: true,
      ...portfolioInclude,
    },
  });

/* ---------- skills ---------- */

export const addSkill = (
  userId: number,
  skillId: number,
  proficiencyLevel: ProficiencyLevel
) =>
  prisma.userSkill.upsert({
    where: { userId_skillId: { userId, skillId } },
    update: { proficiencyLevel },
    create: { userId, skillId, proficiencyLevel },
    include: { skill: true },
  });

export const removeSkill = (userId: number, skillId: number) =>
  prisma.userSkill.delete({
    where: { userId_skillId: { userId, skillId } },
  });

export const skillExists = async (skillId: number) =>
  (await prisma.skill.count({ where: { skillId } })) > 0;

/* ---------- interests ---------- */

export const addInterest = (userId: number, interestId: number) =>
  prisma.userInterest.upsert({
    where: { userId_interestId: { userId, interestId } },
    update: {},
    create: { userId, interestId },
    include: { interest: true },
  });

export const removeInterest = (userId: number, interestId: number) =>
  prisma.userInterest.delete({
    where: { userId_interestId: { userId, interestId } },
  });

export const interestExists = async (interestId: number) =>
  (await prisma.interest.count({ where: { interestId } })) > 0;

/* ---------- education ---------- */

export interface EducationData {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startYear?: number | null;
  endYear?: number | null;
}

export const createEducation = (userId: number, data: EducationData) =>
  prisma.education.create({ data: { userId, ...data } });

export const findEducationOwner = (educationId: number) =>
  prisma.education.findUnique({
    where: { educationId },
    select: { educationId: true, userId: true },
  });

export const updateEducation = (
  educationId: number,
  data: Partial<EducationData>
) => prisma.education.update({ where: { educationId }, data });

export const deleteEducation = (educationId: number) =>
  prisma.education.delete({ where: { educationId } });

/* ---------- publications ---------- */

export interface PublicationData {
  title: string;
  doi?: string | null;
  externalId?: string | null;
  authors?: string | null;
  venue?: string | null;
  year?: number | null;
  citationCount?: number;
  sourceApi?: string;
}

export const createPublication = (userId: number, data: PublicationData) =>
  prisma.publication.create({ data: { userId, ...data } });

export const findPublicationOwner = (publicationId: number) =>
  prisma.publication.findUnique({
    where: { publicationId },
    select: { publicationId: true, userId: true },
  });

export const updatePublication = (
  publicationId: number,
  data: Partial<PublicationData>
) => prisma.publication.update({ where: { publicationId }, data });

export const deletePublication = (publicationId: number) =>
  prisma.publication.delete({ where: { publicationId } });

// Stops the same OpenAlex work being imported twice.
export const findPublicationByExternalId = (
  userId: number,
  externalId: string
) =>
  prisma.publication.findFirst({
    where: { userId, externalId },
    select: { publicationId: true },
  });

/* ---------- previous project experience ---------- */

export interface ExperienceData {
  title: string;
  description?: string | null;
  role?: string | null;
  organization?: string | null;
  startYear?: number | null;
  endYear?: number | null;
}

export const createExperience = (userId: number, data: ExperienceData) =>
  prisma.projectExperience.create({ data: { userId, ...data } });

export const findExperienceOwner = (experienceId: number) =>
  prisma.projectExperience.findUnique({
    where: { experienceId },
    select: { experienceId: true, userId: true },
  });

export const updateExperience = (
  experienceId: number,
  data: Partial<ExperienceData>
) => prisma.projectExperience.update({ where: { experienceId }, data });

export const deleteExperience = (experienceId: number) =>
  prisma.projectExperience.delete({ where: { experienceId } });
