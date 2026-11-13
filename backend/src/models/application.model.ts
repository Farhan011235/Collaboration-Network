import prisma from "../config/prisma";
import { Prisma, ApplicationStatus } from "@prisma/client";

// MODEL LAYER - all database access for applications.
// Feature 2 only creates a request and lists the applicant's own requests;
// the review side (accept/reject) is added by Feature 3.

const applicationInclude = {
  project: {
    select: {
      projectId: true,
      title: true,
      status: true,
      researchDomain: true,
      collaborationType: true,
      ownerId: true,
      owner: { select: { userId: true, fullName: true, institution: true } },
    },
  },
} satisfies Prisma.ApplicationInclude;

// One active request per user per project - the unique key on the model.
export const findExisting = (projectId: number, applicantId: number) =>
  prisma.application.findUnique({
    where: { projectId_applicantId: { projectId, applicantId } },
  });

// Is this user already on the team? Owners and members cannot apply.
export const findMembership = (projectId: number, userId: number) =>
  prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

export const createApplication = (
  projectId: number,
  applicantId: number,
  message?: string
) =>
  prisma.application.create({
    data: { projectId, applicantId, message: message || null },
    include: {
      ...applicationInclude,
      applicant: { select: { userId: true, fullName: true } },
    },
  });

export const findByApplicant = (applicantId: number) =>
  prisma.application.findMany({
    where: { applicantId },
    include: applicationInclude,
    orderBy: { appliedAt: "desc" },
  });

// ------------------------------------------------------------
// REVIEW & TEAM FORMATION   (Fahad - Feature 3)
// ------------------------------------------------------------

// Everything an owner needs to evaluate an applicant. Skills and interests
// come from the applicant's portfolio (populated once Feature 4 lands).
const applicantProfile = {
  select: {
    userId: true,
    fullName: true,
    email: true,
    institution: true,
    designation: true,
    bio: true,
    profilePictureUrl: true,
    orcidId: true,
    websiteUrl: true,
    skills: { include: { skill: true } },
    interests: { include: { interest: true } },
  },
} satisfies Prisma.UserDefaultArgs;

// Slim applicant summary attached to a review response.
const reviewInclude = {
  applicant: {
    select: { userId: true, fullName: true, institution: true },
  },
  project: { select: { projectId: true, title: true } },
} satisfies Prisma.ApplicationInclude;

// All requests for a project, for the owner to review.
// PENDING sorts first (enum definition order) so open requests lead.
export const findByProject = (
  projectId: number,
  status?: ApplicationStatus
) =>
  prisma.application.findMany({
    where: { projectId, ...(status ? { status } : {}) },
    include: { applicant: applicantProfile },
    orderBy: [{ status: "asc" }, { appliedAt: "desc" }],
  });

// Loads an application together with the project owner + team limit,
// so the controller can authorise and cap the team before deciding.
export const findByIdWithProject = (applicationId: number) =>
  prisma.application.findUnique({
    where: { applicationId },
    include: {
      project: {
        select: {
          projectId: true,
          ownerId: true,
          status: true,
          teamSizeLimit: true,
          title: true,
        },
      },
    },
  });

export const countMembers = (projectId: number) =>
  prisma.projectMember.count({ where: { projectId } });

// Accept: mark the request accepted AND add the applicant to the team,
// in one transaction so a half-formed team can never happen.
export const acceptApplication = (
  applicationId: number,
  projectId: number,
  applicantId: number,
  reviewerId: number,
  reviewNote?: string
) =>
  prisma.$transaction(async (tx) => {
    const application = await tx.application.update({
      where: { applicationId },
      data: {
        status: ApplicationStatus.ACCEPTED,
        reviewedById: reviewerId,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      },
      include: reviewInclude,
    });

    // upsert keeps this idempotent if the member row somehow already exists.
    await tx.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: applicantId } },
      update: {},
      create: { projectId, userId: applicantId, role: "MEMBER" },
    });

    return application;
  });

export const rejectApplication = (
  applicationId: number,
  reviewerId: number,
  reviewNote?: string
) =>
  prisma.application.update({
    where: { applicationId },
    data: {
      status: ApplicationStatus.REJECTED,
      reviewedById: reviewerId,
      reviewNote: reviewNote || null,
      reviewedAt: new Date(),
    },
    include: reviewInclude,
  });
