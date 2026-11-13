import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// MODEL LAYER - all database access for milestones.

const milestoneInclude = {
  _count: { select: { tasks: true } },
} satisfies Prisma.MilestoneInclude;

export const findByProject = (projectId: number) =>
  prisma.milestone.findMany({
    where: { projectId },
    include: milestoneInclude,
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });

// Lightweight lookup for authorisation / validation.
export const findById = (milestoneId: number) =>
  prisma.milestone.findUnique({
    where: { milestoneId },
    select: { milestoneId: true, projectId: true, status: true },
  });

export const create = (data: Prisma.MilestoneUncheckedCreateInput) =>
  prisma.milestone.create({ data, include: milestoneInclude });

export const update = (
  milestoneId: number,
  data: Prisma.MilestoneUncheckedUpdateInput
) =>
  prisma.milestone.update({
    where: { milestoneId },
    data,
    include: milestoneInclude,
  });

export const remove = (milestoneId: number) =>
  prisma.milestone.delete({ where: { milestoneId } });
