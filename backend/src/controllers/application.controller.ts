import { Request, Response } from "express";
import { ProjectStatus, ApplicationStatus } from "@prisma/client";
import * as applicationModel from "../models/application.model";
import * as projectModel from "../models/project.model";
import * as notificationModel from "../models/notification.model";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  CreateApplicationInput,
  ReviewApplicationInput,
} from "../validators/application.validator";

// CONTROLLER LAYER - never imports prisma directly.

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// Request to collaborate on a published project (Zunaid - Feature 2).
export const applyToProject = asyncHandler(
  async (req: Request, res: Response) => {
    const { projectId, message } = req.body as CreateApplicationInput;
    const applicantId = req.user!.userId;

    const project = await projectModel.findOwnerAndStatus(projectId);
    if (!project) {
      throw ApiError.notFound("Project not found");
    }

    if (project.status !== ProjectStatus.PUBLISHED) {
      throw ApiError.badRequest(
        "You can only request to join a published project"
      );
    }

    if (project.ownerId === applicantId) {
      throw ApiError.badRequest("You own this project");
    }

    const membership = await applicationModel.findMembership(
      projectId,
      applicantId
    );
    if (membership) {
      throw ApiError.conflict("You are already on this team");
    }

    const existing = await applicationModel.findExisting(projectId, applicantId);
    if (existing) {
      throw ApiError.conflict(
        "You have already requested to join this project"
      );
    }

    const application = await applicationModel.createApplication(
      projectId,
      applicantId,
      message || undefined
    );

    // Let the owner know a new collaboration request came in.
    await notificationModel.createForUser({
      userId: project.ownerId,
      actorId: applicantId,
      projectId,
      type: "APPLICATION_RECEIVED",
      message: `${application.applicant.fullName} requested to join "${application.project.title}"`,
      linkUrl: `/my-projects/${projectId}/requests`,
    });

    return sendSuccess(res, { application }, "Request sent", 201);
  }
);

// The requests the signed-in researcher has sent out.
export const getMyApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const applications = await applicationModel.findByApplicant(
      req.user!.userId
    );
    return sendSuccess(res, { applications });
  }
);

// ------------------------------------------------------------
// REVIEW & TEAM FORMATION   (Fahad - Feature 3)
// ------------------------------------------------------------

// All requests for a project, for the owner to review.
// Ownership is enforced by requireProjectOwner on the route.
export const getProjectApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.id);

    const statusParam = String(req.query.status || "").toUpperCase();
    const status =
      statusParam && statusParam in ApplicationStatus
        ? (statusParam as ApplicationStatus)
        : undefined;

    const applications = await applicationModel.findByProject(
      projectId,
      status
    );

    return sendSuccess(res, { applications });
  }
);

// Accept or reject a collaboration request. Accepting forms the team by
// adding the applicant as a project member (handled in the model).
export const reviewApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const applicationId = parseId(req.params.id);
    const { decision, reviewNote } = req.body as ReviewApplicationInput;

    const application = await applicationModel.findByIdWithProject(
      applicationId
    );
    if (!application) {
      throw ApiError.notFound("Application not found");
    }

    // The param is an application id, so ownership is checked here rather
    // than by the project-id-based middleware.
    if (application.project.ownerId !== req.user!.userId) {
      throw ApiError.forbidden("Only the project owner can review requests");
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw ApiError.badRequest("This request has already been reviewed");
    }

    if (decision === "REJECT") {
      const updated = await applicationModel.rejectApplication(
        applicationId,
        req.user!.userId,
        reviewNote || undefined
      );

      // Let the applicant know their request was declined.
      await notificationModel.createForUser({
        userId: application.applicantId,
        actorId: req.user!.userId,
        projectId: application.projectId,
        type: "APPLICATION_REJECTED",
        message: `Your request to join "${application.project.title}" was declined`,
        linkUrl: `/applications`,
      });

      return sendSuccess(res, { application: updated }, "Request declined");
    }

    // Accepting: don't let the team grow past its stated limit.
    if (application.project.teamSizeLimit) {
      const memberCount = await applicationModel.countMembers(
        application.projectId
      );
      if (memberCount >= application.project.teamSizeLimit) {
        throw ApiError.badRequest("The team is already at its size limit");
      }
    }

    const updated = await applicationModel.acceptApplication(
      applicationId,
      application.projectId,
      application.applicantId,
      req.user!.userId,
      reviewNote || undefined
    );

    // Welcome the applicant onto the team.
    await notificationModel.createForUser({
      userId: application.applicantId,
      actorId: req.user!.userId,
      projectId: application.projectId,
      type: "APPLICATION_ACCEPTED",
      message: `You've been added to the team for "${application.project.title}"`,
      linkUrl: `/projects/${application.projectId}/workspace`,
    });

    return sendSuccess(res, { application: updated }, "Applicant added to the team");
  }
);
