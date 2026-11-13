import { Request, Response } from "express";
import * as teamModel from "../models/team.model";
import * as projectModel from "../models/project.model";
import * as workspaceModel from "../models/workspace.model";
import * as notificationModel from "../models/notification.model";
import { buildProjectAnalytics } from "../services/analytics.service";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  UpdateEvaluationInput,
  UpdateRoleInput,
} from "../validators/team.validator";

// CONTROLLER LAYER - Team Responsibility Management (Module 2 Feature 4).

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  RESEARCH_LEAD: "Research Lead",
  DEVELOPER: "Developer",
  DATA_ANALYST: "Data Analyst",
  WRITER: "Writer",
  MEMBER: "Member",
};

// Only the project owner may assign responsibilities or evaluate members.
// The route params are named :projectId, so ownership is checked here rather
// than by the id-based middleware.
const assertOwner = async (projectId: number, userId: number) => {
  const project = await projectModel.findOwnerAndStatus(projectId);
  if (!project) throw ApiError.notFound("Project not found");
  if (project.ownerId !== userId) {
    throw ApiError.forbidden("Only the project owner can manage the team");
  }
  return project;
};

// The member being changed must actually be on this team, and the owner's own
// row is not something they assign a responsibility to.
const loadTargetMember = async (projectId: number, targetUserId: number) => {
  const member = await teamModel.findMember(projectId, targetUserId);
  if (!member) throw ApiError.notFound("That person is not on this team");
  if (member.role === "OWNER") {
    throw ApiError.badRequest("The project owner's role cannot be changed");
  }
  return member;
};

// GET /team/project/:projectId
// Members see the roster and everyone's responsibilities. The owner also sees
// the contribution evaluations, which are private feedback.
export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const projectId = parseId(req.params.projectId);
  const viewerId = req.user!.userId;

  const [project, members, analytics] = await Promise.all([
    projectModel.findOwnerAndStatus(projectId),
    teamModel.findTeam(projectId),
    // Reuse the analytics contribution figures so "monitor contributions"
    // shows real activity, not just the owner's opinion.
    buildProjectAnalytics(projectId),
  ]);

  if (!project) throw ApiError.notFound("Project not found");
  const isOwner = project.ownerId === viewerId;

  const activityByUser = new Map(
    analytics.contributions.map((c) => [c.userId, c])
  );

  const team = members.map((m) => {
    const activity = activityByUser.get(m.userId);
    // Evaluations are visible to the owner, and to the member about themself.
    const canSeeEvaluation = isOwner || m.userId === viewerId;

    return {
      projectId: m.projectId,
      userId: m.userId,
      role: m.role,
      roleLabel: ROLE_LABEL[m.role] ?? m.role,
      responsibilities: m.responsibilities,
      joinedAt: m.joinedAt,
      user: m.user,
      activity: {
        tasksAssigned: activity?.tasksAssigned ?? 0,
        tasksCompleted: activity?.tasksCompleted ?? 0,
        threads: activity?.threads ?? 0,
        comments: activity?.comments ?? 0,
        documents: activity?.documents ?? 0,
        meetings: activity?.meetings ?? 0,
        activityScore: activity?.score ?? 0,
        sharePercent: activity?.sharePercent ?? 0,
      },
      evaluation: canSeeEvaluation
        ? {
            contributionScore: m.contributionScore,
            contributionNotes: m.contributionNotes,
            evaluatedAt: m.evaluatedAt,
          }
        : null,
    };
  });

  return sendSuccess(res, { team, isOwner });
});

// PATCH /team/project/:projectId/members/:userId
// Assigns the project-specific responsibility.
export const updateMemberRole = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId);
    const targetUserId = parseId(req.params.userId);
    await assertOwner(projectId, req.user!.userId);
    const existing = await loadTargetMember(projectId, targetUserId);

    const body = req.body as UpdateRoleInput;

    const member = await teamModel.updateRole(projectId, targetUserId, {
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.responsibilities !== undefined
        ? { responsibilities: body.responsibilities.trim() || null }
        : {}),
    });

    // Tell the member what they've been asked to take on, but only when the
    // role actually changed - editing the notes shouldn't spam them.
    if (body.role && body.role !== existing.role) {
      await notificationModel.createForUser({
        userId: targetUserId,
        actorId: req.user!.userId,
        projectId,
        type: "ROLE_ASSIGNED",
        message: `You are now ${ROLE_LABEL[body.role]} on this project`,
        linkUrl: `/projects/${projectId}/team`,
      });
    }

    return sendSuccess(res, { member }, "Responsibility updated");
  }
);

// PATCH /team/project/:projectId/members/:userId/evaluation
// Records the owner's assessment of a member's contribution.
export const updateMemberEvaluation = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId);
    const targetUserId = parseId(req.params.userId);
    await assertOwner(projectId, req.user!.userId);
    await loadTargetMember(projectId, targetUserId);

    const body = req.body as UpdateEvaluationInput;

    const member = await teamModel.updateEvaluation(projectId, targetUserId, {
      ...(body.contributionScore !== undefined
        ? { contributionScore: body.contributionScore }
        : {}),
      ...(body.contributionNotes !== undefined
        ? { contributionNotes: body.contributionNotes.trim() || null }
        : {}),
    });

    await notificationModel.createForUser({
      userId: targetUserId,
      actorId: req.user!.userId,
      projectId,
      type: "CONTRIBUTION_EVALUATED",
      message: "Your contribution on this project was reviewed",
      linkUrl: `/projects/${projectId}/team`,
    });

    return sendSuccess(res, { member }, "Evaluation saved");
  }
);
