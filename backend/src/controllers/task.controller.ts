import { Request, Response } from "express";
import { TaskStatus } from "@prisma/client";
import * as taskModel from "../models/task.model";
import * as milestoneModel from "../models/milestone.model";
import * as workspaceModel from "../models/workspace.model";
import * as notificationModel from "../models/notification.model";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "../validators/task.validator";

// CONTROLLER LAYER - never imports prisma directly.

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// A task can only be assigned to someone already on the team.
const assertAssigneeIsMember = async (
  projectId: number,
  assigneeId?: number | null
) => {
  if (assigneeId == null) return;
  const membership = await workspaceModel.findProjectMembership(
    projectId,
    assigneeId
  );
  if (!membership) {
    throw ApiError.badRequest("You can only assign tasks to project members");
  }
};

// A task's milestone must belong to the same project.
const assertMilestoneInProject = async (
  projectId: number,
  milestoneId?: number | null
) => {
  if (milestoneId == null) return;
  const milestone = await milestoneModel.findById(milestoneId);
  if (!milestone || milestone.projectId !== projectId) {
    throw ApiError.badRequest("That milestone does not belong to this project");
  }
};

// Human-friendly labels for the task status shown inside notifications.
const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

// When a task enters DONE we stamp completedAt; leaving DONE clears it.
const completionFor = (status?: TaskStatus): Date | null | undefined => {
  if (status === undefined) return undefined;
  return status === "DONE" ? new Date() : null;
};

// Re-checks membership for routes keyed by task id (not project id).
const loadTaskForMember = async (taskId: number, userId: number) => {
  const task = await taskModel.findById(taskId);
  if (!task) {
    throw ApiError.notFound("Task not found");
  }
  const membership = await workspaceModel.findProjectMembership(
    task.projectId,
    userId
  );
  if (!membership) {
    throw ApiError.forbidden("You must be a member of this project");
  }
  return task;
};

// Membership enforced by requireProjectMember on the route.
export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.projectId);

  const statusParam = String(req.query.status || "").toUpperCase();
  const status =
    statusParam && statusParam in TaskStatus
      ? (statusParam as TaskStatus)
      : undefined;
  const assigneeId = req.query.assigneeId
    ? Number(req.query.assigneeId)
    : undefined;
  const milestoneId = req.query.milestoneId
    ? Number(req.query.milestoneId)
    : undefined;

  const tasks = await taskModel.findByProject(projectId, {
    status,
    assigneeId: Number.isInteger(assigneeId) ? assigneeId : undefined,
    milestoneId: Number.isInteger(milestoneId) ? milestoneId : undefined,
  });

  return sendSuccess(res, { tasks });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.projectId);
  const body = req.body as CreateTaskInput;

  await assertAssigneeIsMember(projectId, body.assigneeId);
  await assertMilestoneInProject(projectId, body.milestoneId);

  const task = await taskModel.create({
    projectId,
    createdById: req.user!.userId,
    title: body.title,
    description: body.description || null,
    status: body.status,
    priority: body.priority,
    dueDate: body.dueDate ?? null,
    assigneeId: body.assigneeId ?? null,
    milestoneId: body.milestoneId ?? null,
    completedAt: body.status === "DONE" ? new Date() : null,
  });

  // Tell the assignee they picked up a task (unless they assigned it to themself).
  if (task.assigneeId != null) {
    await notificationModel.createForUser({
      userId: task.assigneeId,
      actorId: req.user!.userId,
      projectId,
      type: "TASK_ASSIGNED",
      message: `You were assigned a task: "${task.title}"`,
      linkUrl: `/projects/${projectId}/workspace`,
    });
  }

  return sendSuccess(res, { task }, "Task created", 201);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = parseId(req.params.id);
  const task = await loadTaskForMember(taskId, req.user!.userId);

  const body = req.body as UpdateTaskInput;

  await assertAssigneeIsMember(task.projectId, body.assigneeId);
  await assertMilestoneInProject(task.projectId, body.milestoneId);

  const completedAt = completionFor(body.status);

  const updated = await taskModel.update(taskId, {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.description !== undefined
      ? { description: body.description || null }
      : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.dueDate !== undefined ? { dueDate: body.dueDate ?? null } : {}),
    ...(body.assigneeId !== undefined
      ? { assigneeId: body.assigneeId ?? null }
      : {}),
    ...(body.milestoneId !== undefined
      ? { milestoneId: body.milestoneId ?? null }
      : {}),
    ...(completedAt !== undefined ? { completedAt } : {}),
  });

  // Notify the assignee about changes to their task. A brand-new assignee
  // gets an "assigned" notice; an existing one gets an "updated" notice.
  const assigneeId = updated.assigneeId;
  if (assigneeId != null && assigneeId !== req.user!.userId) {
    const reassigned = assigneeId !== task.assigneeId;
    await notificationModel.createForUser({
      userId: assigneeId,
      actorId: req.user!.userId,
      projectId: task.projectId,
      type: reassigned ? "TASK_ASSIGNED" : "TASK_UPDATED",
      message: reassigned
        ? `You were assigned a task: "${updated.title}"`
        : `A task assigned to you was updated: "${updated.title}"`,
      linkUrl: `/projects/${task.projectId}/workspace`,
    });
  }

  return sendSuccess(res, { task: updated }, "Task updated");
});

// The quick "move to another column" action from the board.
export const updateTaskStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const taskId = parseId(req.params.id);
    const task = await loadTaskForMember(taskId, req.user!.userId);

    const { status } = req.body as UpdateTaskStatusInput;

    const updated = await taskModel.update(taskId, {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    });

    // Keep the assignee in the loop when someone else moves their task.
    if (task.assigneeId != null && task.assigneeId !== req.user!.userId) {
      await notificationModel.createForUser({
        userId: task.assigneeId,
        actorId: req.user!.userId,
        projectId: task.projectId,
        type: "TASK_UPDATED",
        message: `Your task "${updated.title}" was moved to ${STATUS_LABEL[status]}`,
        linkUrl: `/projects/${task.projectId}/workspace`,
      });
    }

    return sendSuccess(res, { task: updated }, "Task moved");
  }
);

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = parseId(req.params.id);
  await loadTaskForMember(taskId, req.user!.userId);

  await taskModel.remove(taskId);

  return sendSuccess(res, { taskId }, "Task deleted");
});
