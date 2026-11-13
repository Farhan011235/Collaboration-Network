import prisma from "../config/prisma";
import { MemberRole } from "@prisma/client";

// MODEL LAYER - team roles, responsibilities and contribution evaluations
// (Module 2 Feature 4). The columns already existed on ProjectMember; this
// adds the queries that let owners actually use them.

const memberInclude = {
  user: {
    select: {
      userId: true,
      fullName: true,
      email: true,
      institution: true,
      designation: true,
      profilePictureUrl: true,
    },
  },
};

export const findTeam = (projectId: number) =>
  prisma.projectMember.findMany({
    where: { projectId },
    include: memberInclude,
    // Owner first, then the order people joined.
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

export const findMember = (projectId: number, userId: number) =>
  prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: memberInclude,
  });

// Assigning the project-specific responsibility (Research Lead, Developer...).
export const updateRole = (
  projectId: number,
  userId: number,
  data: { role?: MemberRole; responsibilities?: string | null }
) =>
  prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data,
    include: memberInclude,
  });

// The owner's own assessment of a member, stamped with when it was made.
export const updateEvaluation = (
  projectId: number,
  userId: number,
  data: { contributionScore?: number | null; contributionNotes?: string | null }
) =>
  prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { ...data, evaluatedAt: new Date() },
    include: memberInclude,
  });
