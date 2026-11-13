import prisma from "../config/prisma";
import { Prisma, ProjectStatus } from "@prisma/client";

// MODEL LAYER - data the recommender needs (Module 3 Feature 2).
// A researcher's "taste" comes from explicit portfolio signals AND from the
// projects they already engage with, so recommendations work even before any
// portfolio UI exists.

const projectInclude = {
  owner: {
    select: {
      userId: true,
      fullName: true,
      institution: true,
      designation: true,
      profilePictureUrl: true,
    },
  },
  skillRequirements: { include: { skill: true } },
  _count: { select: { applications: true, members: true } },
} satisfies Prisma.ProjectInclude;

export type CandidateProject = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

// A slim shape for the projects we only mine for signal (domain + skills).
const engagedSelect = {
  projectId: true,
  researchDomain: true,
  skillRequirements: {
    select: { skillId: true, skill: { select: { name: true } } },
  },
} satisfies Prisma.ProjectSelect;

// Explicit portfolio signals (Module 1 Feature 4). These are the strongest
// signals we have, because the researcher declared them about themselves.
export const getUserSkills = (userId: number) =>
  prisma.userSkill.findMany({ where: { userId }, include: { skill: true } });

export const getUserInterests = (userId: number) =>
  prisma.userInterest.findMany({
    where: { userId },
    include: { interest: true },
  });

// Academic background - the field of study is a strong topical signal.
export const getUserEducation = (userId: number) =>
  prisma.education.findMany({
    where: { userId },
    select: { fieldOfStudy: true, degree: true },
  });

// What the researcher has published tells us what they actually work on.
export const getUserPublications = (userId: number) =>
  prisma.publication.findMany({
    where: { userId },
    select: { title: true, venue: true },
    take: 50,
  });

// Projects the user is a member of (owned + joined): strongest inferred taste,
// and the set we exclude from candidates.
export const getMemberProjects = (userId: number) =>
  prisma.project.findMany({
    where: { members: { some: { userId } } },
    select: engagedSelect,
  });

// Projects the user applied to: a weaker signal of what they're drawn to,
// and also something we must not recommend back to them.
export const getAppliedProjects = (userId: number) =>
  prisma.project.findMany({
    where: { applications: { some: { applicantId: userId } } },
    select: engagedSelect,
  });

// Candidate pool: published projects the user neither owns nor is on.
export const getCandidates = (userId: number, excludeProjectIds: number[]) => {
  const where: Prisma.ProjectWhereInput = {
    status: ProjectStatus.PUBLISHED,
    ownerId: { not: userId },
  };
  if (excludeProjectIds.length > 0) {
    where.projectId = { notIn: excludeProjectIds };
  }
  return prisma.project.findMany({
    where,
    include: projectInclude,
    orderBy: { publishedAt: "desc" },
    take: 200,
  });
};
