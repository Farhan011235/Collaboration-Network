import prisma from "../config/prisma";

// MODEL LAYER - the extra project detail a report needs on top of the
// analytics figures (Module 3 Feature 6).

export const getProjectHeader = (projectId: number) =>
  prisma.project.findUnique({
    where: { projectId },
    select: {
      projectId: true,
      title: true,
      description: true,
      objectives: true,
      researchDomain: true,
      collaborationType: true,
      status: true,
      durationMonths: true,
      publishedAt: true,
      createdAt: true,
      owner: { select: { fullName: true, institution: true, email: true } },
    },
  });

// Every task, grouped in the report by milestone. Ordered so the reader sees
// open work first within each milestone.
export const getTasksForReport = (projectId: number) =>
  prisma.task.findMany({
    where: { projectId },
    select: {
      taskId: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      milestoneId: true,
      milestone: { select: { title: true } },
      assignee: { select: { fullName: true } },
    },
    orderBy: [{ milestoneId: "asc" }, { status: "asc" }, { createdAt: "asc" }],
  });
