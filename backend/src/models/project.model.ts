import prisma from "../config/prisma";
import { Prisma, ProjectStatus } from "@prisma/client";
import {
  CreateProjectInput,
  UpdateProjectInput,
  SearchProjectInput,
} from "../validators/project.validator";

// MODEL LAYER - all database access for projects.

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
  skillRequirements: {
    include: { skill: true },
  },
  _count: {
    select: { applications: true, members: true },
  },
} satisfies Prisma.ProjectInclude;

export const createProject = async (
  ownerId: number,
  data: CreateProjectInput
) => {
  const { skills, ...projectData } = data;

  // The project and its owner-membership must be created together.
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        ...projectData,
        objectives: projectData.objectives || null,
        expectedOutcomes: projectData.expectedOutcomes || null,
        ownerId,
        status: ProjectStatus.DRAFT,
        skillRequirements: {
          create: skills.map((s) => ({
            skillId: s.skillId,
            importanceLevel: s.importanceLevel,
          })),
        },
      },
      include: projectInclude,
    });

    await tx.projectMember.create({
      data: { projectId: project.projectId, userId: ownerId, role: "OWNER" },
    });

    return project;
  });
};

export const findById = async (projectId: number) => {
  return prisma.project.findUnique({
    where: { projectId },
    include: projectInclude,
  });
};

// Lightweight lookup used by the ownership check - avoids loading relations.
export const findOwnerAndStatus = async (projectId: number) => {
  return prisma.project.findUnique({
    where: { projectId },
    select: { projectId: true, ownerId: true, status: true },
  });
};

export const findByOwner = async (ownerId: number, status?: ProjectStatus) => {
  return prisma.project.findMany({
    where: { ownerId, ...(status ? { status } : {}) },
    include: projectInclude,
    orderBy: { updatedAt: "desc" },
  });
};

export const updateProject = async (
  projectId: number,
  data: UpdateProjectInput
) => {
  const { skills, ...projectData } = data;

  return prisma.$transaction(async (tx) => {
    // Replacing the whole skill set is simpler and safer than diffing it.
    if (skills) {
      await tx.projectSkillRequirement.deleteMany({ where: { projectId } });
      if (skills.length > 0) {
        await tx.projectSkillRequirement.createMany({
          data: skills.map((s) => ({
            projectId,
            skillId: s.skillId,
            importanceLevel: s.importanceLevel,
          })),
        });
      }
    }

    return tx.project.update({
      where: { projectId },
      data: {
        ...projectData,
        ...(projectData.objectives !== undefined
          ? { objectives: projectData.objectives || null }
          : {}),
        ...(projectData.expectedOutcomes !== undefined
          ? { expectedOutcomes: projectData.expectedOutcomes || null }
          : {}),
      },
      include: projectInclude,
    });
  });
};

export const updateStatus = async (
  projectId: number,
  status: ProjectStatus,
  publishedAt?: Date
) => {
  return prisma.project.update({
    where: { projectId },
    data: { status, ...(publishedAt ? { publishedAt } : {}) },
    include: projectInclude,
  });
};

export const deleteProject = async (projectId: number) => {
  return prisma.project.delete({ where: { projectId } });
};

export const countSkillsById = async (skillIds: number[]) => {
  return prisma.skill.count({ where: { skillId: { in: skillIds } } });
};

// ------------------------------------------------------------
// SEARCH & DISCOVERY   (Zunaid - Feature 2)
// ------------------------------------------------------------

const sortOrder: Record<
  SearchProjectInput["sort"],
  Prisma.ProjectOrderByWithRelationInput
> = {
  recent: { publishedAt: "desc" },
  oldest: { publishedAt: "asc" },
  team: { members: { _count: "desc" } },
};

// Builds a dynamic WHERE from the supplied filters and returns a page of
// results together with the total count (for pagination on the client).
// viewerId is excluded so researchers never discover their own projects.
export const searchProjects = async (
  filters: SearchProjectInput,
  viewerId: number
) => {
  const {
    keyword,
    researchDomain,
    collaborationType,
    skillIds,
    minDuration,
    maxDuration,
    sort,
    page,
    pageSize,
  } = filters;

  const where: Prisma.ProjectWhereInput = {
    // Discovery only ever surfaces published proposals.
    status: ProjectStatus.PUBLISHED,
    // A researcher discovers others' work, not their own.
    ownerId: { not: viewerId },
  };

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { researchDomain: { contains: keyword, mode: "insensitive" } },
    ];
  }

  if (researchDomain) {
    where.researchDomain = { equals: researchDomain, mode: "insensitive" };
  }

  if (collaborationType) {
    where.collaborationType = collaborationType;
  }

  // A project matches if it requires ANY of the chosen skills.
  if (skillIds && skillIds.length > 0) {
    where.skillRequirements = { some: { skillId: { in: skillIds } } };
  }

  if (minDuration !== undefined || maxDuration !== undefined) {
    where.durationMonths = {
      ...(minDuration !== undefined ? { gte: minDuration } : {}),
      ...(maxDuration !== undefined ? { lte: maxDuration } : {}),
    };
  }

  // Count and page run together so the total stays consistent with the rows.
  const [total, projects] = await prisma.$transaction([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: [sortOrder[sort], { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    projects,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
};
