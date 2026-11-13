import prisma from "../config/prisma";
import { TaskStatus } from "@prisma/client";

// MODEL LAYER - aggregate queries for the Project Analytics Dashboard
// (Module 3 Feature 4). Read-only; every query is scoped to one project.

export const getTaskStatusCounts = async (projectId: number) => {
  const grouped = await prisma.task.groupBy({
    by: ["status"],
    where: { projectId },
    _count: { _all: true },
  });

  const counts: Record<TaskStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  };
  grouped.forEach((g) => {
    counts[g.status] = g._count._all;
  });
  return counts;
};

export const getTaskPriorityCounts = async (projectId: number) => {
  const grouped = await prisma.task.groupBy({
    by: ["priority"],
    where: { projectId },
    _count: { _all: true },
  });
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  grouped.forEach((g) => {
    counts[g.priority] = g._count._all;
  });
  return counts;
};

// Tasks past their due date that still aren't done.
export const countOverdueTasks = (projectId: number) =>
  prisma.task.count({
    where: {
      projectId,
      status: { not: TaskStatus.DONE },
      dueDate: { lt: new Date() },
    },
  });

// Milestones with their task roll-up, for the per-milestone progress bars.
export const getMilestoneBreakdown = (projectId: number) =>
  prisma.milestone.findMany({
    where: { projectId },
    select: {
      milestoneId: true,
      title: true,
      status: true,
      dueDate: true,
      tasks: { select: { status: true } },
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });

// Completion timeline: every task completion date, so the service can bucket
// them by day and build a cumulative curve.
export const getCompletedTaskDates = (projectId: number, since: Date) =>
  prisma.task.findMany({
    where: { projectId, completedAt: { gte: since } },
    select: { completedAt: true },
    orderBy: { completedAt: "asc" },
  });

// Tasks completed before the window starts - the cumulative curve's baseline.
export const countCompletedBefore = (projectId: number, since: Date) =>
  prisma.task.count({
    where: { projectId, completedAt: { lt: since } },
  });

export const getMembers = (projectId: number) =>
  prisma.projectMember.findMany({
    where: { projectId },
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: { select: { userId: true, fullName: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

// ---- per-member contribution signals (derived from real activity) ----

export const getTaskCountsByAssignee = (projectId: number) =>
  prisma.task.groupBy({
    by: ["assigneeId", "status"],
    where: { projectId, assigneeId: { not: null } },
    _count: { _all: true },
  });

export const getThreadCountsByAuthor = (projectId: number) =>
  prisma.discussionThread.groupBy({
    by: ["authorId"],
    where: { projectId },
    _count: { _all: true },
  });

export const getCommentCountsByAuthor = (projectId: number) =>
  prisma.discussionComment.groupBy({
    by: ["authorId"],
    where: { thread: { projectId } },
    _count: { _all: true },
  });

export const getDocumentCountsByUploader = (projectId: number) =>
  prisma.projectDocument.groupBy({
    by: ["uploaderId"],
    where: { projectId },
    _count: { _all: true },
  });

export const getMeetingCountsByOrganizer = (projectId: number) =>
  prisma.meeting.groupBy({
    by: ["organizerId"],
    where: { projectId },
    _count: { _all: true },
  });

// ---- project-wide collaboration totals ----

export const getCollaborationTotals = async (projectId: number) => {
  const [threads, comments, documents, meetings, applications] =
    await prisma.$transaction([
      prisma.discussionThread.count({ where: { projectId } }),
      prisma.discussionComment.count({ where: { thread: { projectId } } }),
      prisma.projectDocument.count({ where: { projectId } }),
      prisma.meeting.count({ where: { projectId } }),
      prisma.application.count({ where: { projectId } }),
    ]);
  return { threads, comments, documents, meetings, applications };
};
