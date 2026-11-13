import { Request, Response } from "express";
import * as discussionModel from "../models/discussion.model";
import * as notificationModel from "../models/notification.model";
import * as workspaceModel from "../models/workspace.model";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  CreateThreadInput,
  CreateCommentInput,
} from "../validators/discussion.validator";

// CONTROLLER LAYER - never imports prisma directly.

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// Routes keyed by thread id need their own membership re-check.
const loadThreadForMember = async (threadId: number, userId: number) => {
  const thread = await discussionModel.findThreadMeta(threadId);
  if (!thread) {
    throw ApiError.notFound("Discussion not found");
  }
  const membership = await workspaceModel.findProjectMembership(
    thread.projectId,
    userId
  );
  if (!membership) {
    throw ApiError.forbidden("You must be a member of this project");
  }
  return thread;
};

// Project membership enforced by requireProjectMember on the route.
export const listThreads = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.projectId);
  const threads = await discussionModel.findThreadsByProject(projectId);
  return sendSuccess(res, { threads });
});

export const createThread = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.projectId);
  const body = req.body as CreateThreadInput;

  const thread = await discussionModel.createThread(
    projectId,
    req.user!.userId,
    body
  );

  // Tell the rest of the team a new discussion started.
  await notificationModel.createForMembers({
    projectId,
    actorId: req.user!.userId,
    type: "DISCUSSION_THREAD",
    message: `${thread.author.fullName} started a discussion: "${thread.title}"`,
    linkUrl: `/projects/${projectId}/discussion/${thread.threadId}`,
  });

  return sendSuccess(res, { thread }, "Discussion posted", 201);
});

export const getThread = asyncHandler(async (req: Request, res: Response) => {
  const threadId = parseId(req.params.id);
  await loadThreadForMember(threadId, req.user!.userId);

  const thread = await discussionModel.findThreadById(threadId);
  return sendSuccess(res, { thread });
});

export const createComment = asyncHandler(
  async (req: Request, res: Response) => {
    const threadId = parseId(req.params.id);
    const meta = await loadThreadForMember(threadId, req.user!.userId);

    const { body } = req.body as CreateCommentInput;
    const comment = await discussionModel.createComment(
      threadId,
      req.user!.userId,
      body
    );

    await notificationModel.createForMembers({
      projectId: meta.projectId,
      actorId: req.user!.userId,
      type: "DISCUSSION_REPLY",
      message: `${comment.author.fullName} replied in "${meta.title}"`,
      linkUrl: `/projects/${meta.projectId}/discussion/${threadId}`,
    });

    return sendSuccess(res, { comment }, "Reply posted", 201);
  }
);

export const deleteThread = asyncHandler(async (req: Request, res: Response) => {
  const threadId = parseId(req.params.id);
  const meta = await loadThreadForMember(threadId, req.user!.userId);

  // Only the author can remove their own thread.
  if (meta.authorId !== req.user!.userId) {
    throw ApiError.forbidden("You can only delete your own discussion");
  }

  await discussionModel.deleteThread(threadId);
  return sendSuccess(res, { threadId }, "Discussion deleted");
});

export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    const commentId = parseId(req.params.id);

    const comment = await discussionModel.findCommentMeta(commentId);
    if (!comment) {
      throw ApiError.notFound("Reply not found");
    }

    const membership = await workspaceModel.findProjectMembership(
      comment.thread.projectId,
      req.user!.userId
    );
    if (!membership) {
      throw ApiError.forbidden("You must be a member of this project");
    }
    if (comment.authorId !== req.user!.userId) {
      throw ApiError.forbidden("You can only delete your own reply");
    }

    await discussionModel.deleteComment(commentId);
    return sendSuccess(res, { commentId }, "Reply deleted");
  }
);
