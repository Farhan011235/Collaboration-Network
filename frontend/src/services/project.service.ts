import api from "@/lib/axios";
import type {
  ApiResponse,
  Project,
  ProjectFormValues,
  ProjectSearchFilters,
  ProjectSearchResult,
  ProjectStatus,
} from "@/types";

// Discovery search over published proposals (Feature 2).
// Only non-empty filters are sent, and skillIds go as a comma-separated list.
export const searchProjects = async (
  filters: ProjectSearchFilters
): Promise<ProjectSearchResult> => {
  const params: Record<string, string | number> = {};

  if (filters.keyword?.trim()) params.keyword = filters.keyword.trim();
  if (filters.researchDomain) params.researchDomain = filters.researchDomain;
  if (filters.collaborationType)
    params.collaborationType = filters.collaborationType;
  if (filters.skillIds && filters.skillIds.length > 0)
    params.skillIds = filters.skillIds.join(",");
  if (filters.minDuration) params.minDuration = filters.minDuration;
  if (filters.maxDuration) params.maxDuration = filters.maxDuration;
  if (filters.sort) params.sort = filters.sort;
  params.page = filters.page ?? 1;
  params.pageSize = filters.pageSize ?? 12;

  const res = await api.get<ApiResponse<ProjectSearchResult>>("/projects", {
    params,
  });
  return res.data.data;
};

export const createProject = async (data: ProjectFormValues): Promise<Project> => {
  const res = await api.post<ApiResponse<{ project: Project }>>("/projects", data);
  return res.data.data.project;
};

export const getMyProjects = async (status?: ProjectStatus): Promise<Project[]> => {
  const res = await api.get<ApiResponse<{ projects: Project[] }>>("/projects/mine", {
    params: status ? { status } : undefined,
  });
  return res.data.data.projects;
};

export const getProject = async (projectId: number): Promise<Project> => {
  const res = await api.get<ApiResponse<{ project: Project }>>(`/projects/${projectId}`);
  return res.data.data.project;
};

export const updateProject = async (
  projectId: number,
  data: Partial<ProjectFormValues>
): Promise<Project> => {
  const res = await api.patch<ApiResponse<{ project: Project }>>(
    `/projects/${projectId}`,
    data
  );
  return res.data.data.project;
};

const statusAction = (action: "publish" | "archive" | "reopen") =>
  async (projectId: number): Promise<Project> => {
    const res = await api.patch<ApiResponse<{ project: Project }>>(
      `/projects/${projectId}/${action}`
    );
    return res.data.data.project;
  };

export const publishProject = statusAction("publish");
export const archiveProject = statusAction("archive");
export const reopenProject = statusAction("reopen");

export const deleteProject = async (projectId: number): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};
