import api from "@/lib/axios";
import type {
  ApiResponse,
  Application,
  ApplicationDecision,
  ApplicationStatus,
  ProjectApplication,
} from "@/types";

// Request to collaborate on a project (Feature 2).
export const applyToProject = async (
  projectId: number,
  message?: string
): Promise<Application> => {
  const res = await api.post<ApiResponse<{ application: Application }>>(
    "/applications",
    { projectId, message: message?.trim() || undefined }
  );
  return res.data.data.application;
};

// The signed-in researcher's own outgoing requests.
export const getMyApplications = async (): Promise<Application[]> => {
  const res = await api.get<ApiResponse<{ applications: Application[] }>>(
    "/applications/mine"
  );
  return res.data.data.applications;
};

// Owner-side: all requests for one of your projects (Feature 3).
export const getProjectApplications = async (
  projectId: number,
  status?: ApplicationStatus
): Promise<ProjectApplication[]> => {
  const res = await api.get<ApiResponse<{ applications: ProjectApplication[] }>>(
    `/applications/project/${projectId}`,
    { params: status ? { status } : undefined }
  );
  return res.data.data.applications;
};

// Accept or reject a request. Accepting adds the applicant to the team.
export const reviewApplication = async (
  applicationId: number,
  decision: ApplicationDecision,
  reviewNote?: string
): Promise<Application> => {
  const res = await api.patch<ApiResponse<{ application: Application }>>(
    `/applications/${applicationId}/review`,
    { decision, reviewNote: reviewNote?.trim() || undefined }
  );
  return res.data.data.application;
};
