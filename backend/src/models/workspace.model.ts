import prisma from "../config/prisma";
import { TaskStatus } from "@prisma/client";

// MODEL LAYER - shared workspace queries (Module 2 Feature 1).
// Membership, team roster, "projects I'm on", and completion stats.

// Is this user on the team? Owners are members too (role OWNER), so this
// covers both the owner and accepted collaborators.
export const findProjectMembership = (projectId: number, userId: number) =>
  prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

// Just the ids - used on hot paths that only need "who is on this team",
// so we don't pay for the user join.
export const findMemberIds = async (projectId: number): Promise<number[]> => {
  const rows = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
};

export const findMembers = (projectId: number) =>
  prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          userId: true,
          fullName: true,
          profilePictureUrl: true,
          institution: true,
          designation: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

// Projects the user has JOINED (is a member of) but does not own -
// their own projects already live under "Your projects".
export const findJoinedProjects = (userId: number) =>
  prisma.project.findMany({
    where: { members: { some: { userId } }, NOT: { ownerId: userId } },
    include: {
      owner: { select: { userId: true, fullName: true, institution: true } },
      _count: { select: { members: true, tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

// How many tasks sit in each column - powers the completion bar.
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

export const getMilestoneCounts = async (projectId: number) => {
  const [total, completed] = await prisma.$transaction([
    prisma.milestone.count({ where: { projectId } }),
    prisma.milestone.count({ where: { projectId, status: "COMPLETED" } }),
  ]);
  return { total, completed };
};
