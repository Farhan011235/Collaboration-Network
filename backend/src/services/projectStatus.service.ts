import { ProjectStatus } from "@prisma/client";
import { ApiError } from "../utils/apiError";

// The lifecycle of a proposal, in one place.
//   DRAFT      -> PUBLISHED            (publish)
//   PUBLISHED  -> ARCHIVED, COMPLETED  (archive / finish)
//   ARCHIVED   -> PUBLISHED            (reopen)
//   COMPLETED  -> nothing
const allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: [ProjectStatus.PUBLISHED],
  PUBLISHED: [ProjectStatus.ARCHIVED, ProjectStatus.COMPLETED],
  ARCHIVED: [ProjectStatus.PUBLISHED],
  COMPLETED: [],
};

const readableStatus: Record<ProjectStatus, string> = {
  DRAFT: "a draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  COMPLETED: "completed",
};

export const assertTransitionAllowed = (
  from: ProjectStatus,
  to: ProjectStatus
) => {
  if (!allowedTransitions[from].includes(to)) {
    throw ApiError.badRequest(
      `A project that is ${readableStatus[from]} cannot become ${readableStatus[to]}`
    );
  }
};

// Published projects are visible to everyone; a draft belongs to its owner only.
export const canView = (
  status: ProjectStatus,
  ownerId: number,
  viewerId?: number
): boolean => {
  if (status === ProjectStatus.DRAFT) return ownerId === viewerId;
  return true;
};
