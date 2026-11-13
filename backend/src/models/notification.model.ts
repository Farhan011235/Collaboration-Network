import prisma from "../config/prisma";
import { NotificationType } from "@prisma/client";

// MODEL LAYER - all database access for notifications (Module 2 Feature 2).

const notificationInclude = {
  actor: { select: { userId: true, fullName: true, profilePictureUrl: true } },
};

export const findByUser = (userId: number) =>
  prisma.notification.findMany({
    where: { userId },
    include: notificationInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

export const countUnread = (userId: number) =>
  prisma.notification.count({ where: { userId, isRead: false } });

export const findById = (notificationId: number) =>
  prisma.notification.findUnique({
    where: { notificationId },
    select: { notificationId: true, userId: true },
  });

export const markRead = (notificationId: number) =>
  prisma.notification.update({
    where: { notificationId },
    data: { isRead: true },
  });

export const markAllRead = (userId: number) =>
  prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

interface NotifyMembersInput {
  projectId: number;
  actorId: number;
  type: NotificationType;
  message: string;
  linkUrl?: string;
  // Callers that already know the team can pass it in, saving a query on a
  // database that is far away.
  memberIds?: number[];
}

// Fan out a notification to every project member EXCEPT the person who
// triggered it. Used by the discussion controller.
export const createForMembers = async ({
  projectId,
  actorId,
  type,
  message,
  linkUrl,
  memberIds,
}: NotifyMembersInput) => {
  const recipientIds =
    memberIds?.filter((id) => id !== actorId) ??
    (
      await prisma.projectMember.findMany({
        where: { projectId, NOT: { userId: actorId } },
        select: { userId: true },
      })
    ).map((m) => m.userId);

  if (recipientIds.length === 0) return;

  await prisma.notification.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      actorId,
      projectId,
      type,
      message,
      linkUrl: linkUrl ?? null,
    })),
  });
};

interface NotifyUserInput {
  userId: number;
  actorId: number;
  projectId?: number;
  type: NotificationType;
  message: string;
  linkUrl?: string;
}

// Notify a single person about an activity (a collaboration request, a task
// assignment, etc.). Skipped when the recipient is the actor, so nobody is
// ever notified about their own action.
export const createForUser = async ({
  userId,
  actorId,
  projectId,
  type,
  message,
  linkUrl,
}: NotifyUserInput) => {
  if (userId === actorId) return;

  await prisma.notification.create({
    data: {
      userId,
      actorId,
      projectId: projectId ?? null,
      type,
      message,
      linkUrl: linkUrl ?? null,
    },
  });
};
