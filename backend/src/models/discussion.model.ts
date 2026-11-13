import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// MODEL LAYER - all database access for discussion threads & comments.

const authorSelect = {
  select: { userId: true, fullName: true, profilePictureUrl: true },
};

const threadListInclude = {
  author: authorSelect,
  _count: { select: { comments: true } },
} satisfies Prisma.DiscussionThreadInclude;

const threadDetailInclude = {
  author: authorSelect,
  comments: {
    include: { author: authorSelect },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.DiscussionThreadInclude;

export const findThreadsByProject = (projectId: number) =>
  prisma.discussionThread.findMany({
    where: { projectId },
    include: threadListInclude,
    orderBy: { createdAt: "desc" },
  });

export const findThreadById = (threadId: number) =>
  prisma.discussionThread.findUnique({
    where: { threadId },
    include: threadDetailInclude,
  });

// Lightweight lookup for authorisation / notifications.
export const findThreadMeta = (threadId: number) =>
  prisma.discussionThread.findUnique({
    where: { threadId },
    select: { threadId: true, projectId: true, authorId: true, title: true },
  });

export const createThread = (
  projectId: number,
  authorId: number,
  data: { title: string; body: string }
) =>
  prisma.discussionThread.create({
    data: { projectId, authorId, title: data.title, body: data.body },
    include: threadListInclude,
  });

export const deleteThread = (threadId: number) =>
  prisma.discussionThread.delete({ where: { threadId } });

export const createComment = (
  threadId: number,
  authorId: number,
  body: string
) =>
  prisma.discussionComment.create({
    data: { threadId, authorId, body },
    include: { author: authorSelect },
  });

export const findCommentMeta = (commentId: number) =>
  prisma.discussionComment.findUnique({
    where: { commentId },
    select: {
      commentId: true,
      authorId: true,
      thread: { select: { projectId: true } },
    },
  });

export const deleteComment = (commentId: number) =>
  prisma.discussionComment.delete({ where: { commentId } });
