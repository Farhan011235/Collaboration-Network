import prisma from "../config/prisma";
import { Prisma, TaskStatus } from "@prisma/client";

// MODEL LAYER - all database access for tasks.

const taskInclude = {
  assignee: {
    select: { userId: true, fullName: true, profilePictureUrl: true },
  },
  createdBy: { select: { userId: true, fullName: true } },
  milestone: { select: { milestoneId: true, title: true, status: true } },
} satisfies Prisma.TaskInclude;

export interface TaskFilters {
  status?: TaskStatus;
  assigneeId?: number;
  milestoneId?: number;
}

export const findByProject = (projectId: number, filters: TaskFilters = {}) => {
  const where: Prisma.TaskWhereInput = { projectId };
  if (filters.status) where.status = filters.status;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.milestoneId) where.milestoneId = filters.milestoneId;

  return prisma.task.findMany({
    where,
    include: taskInclude,
    // HIGH priority first (enum order), then oldest first within a column.
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
};

// Lightweight lookup for authorisation (which project owns this task?) and
// for notifications (who is it assigned to, what's it called?).
export const findById = (taskId: number) =>
  prisma.task.findUnique({
    where: { taskId },
    select: {
      taskId: true,
      projectId: true,
      status: true,
      title: true,
      assigneeId: true,
    },
  });

export const create = (data: Prisma.TaskUncheckedCreateInput) =>
  prisma.task.create({ data, include: taskInclude });

export const update = (taskId: number, data: Prisma.TaskUncheckedUpdateInput) =>
  prisma.task.update({ where: { taskId }, data, include: taskInclude });

export const remove = (taskId: number) =>
  prisma.task.delete({ where: { taskId } });
