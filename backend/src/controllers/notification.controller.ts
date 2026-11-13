import { Request, Response } from "express";
import * as notificationModel from "../models/notification.model";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

// CONTROLLER LAYER - never imports prisma directly.

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

export const listNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const [notifications, unreadCount] = await Promise.all([
      notificationModel.findByUser(req.user!.userId),
      notificationModel.countUnread(req.user!.userId),
    ]);
    return sendSuccess(res, { notifications, unreadCount });
  }
);

// Lightweight endpoint for the navbar bell.
export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const unreadCount = await notificationModel.countUnread(req.user!.userId);
    return sendSuccess(res, { unreadCount });
  }
);

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notificationId = parseId(req.params.id);

  const notification = await notificationModel.findById(notificationId);
  if (!notification) {
    throw ApiError.notFound("Notification not found");
  }
  // You can only touch your own notifications.
  if (notification.userId !== req.user!.userId) {
    throw ApiError.forbidden("Not your notification");
  }

  await notificationModel.markRead(notificationId);
  return sendSuccess(res, { notificationId }, "Marked as read");
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationModel.markAllRead(req.user!.userId);
  return sendSuccess(res, {}, "All caught up");
});
