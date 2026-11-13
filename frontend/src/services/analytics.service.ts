import api from "@/lib/axios";
import type { ApiResponse, ProjectAnalytics } from "@/types";

// Project Analytics Dashboard API calls (Module 3 Feature 4).

export const getProjectAnalytics = async (
  projectId: number
): Promise<ProjectAnalytics> => {
  const res = await api.get<ApiResponse<{ analytics: ProjectAnalytics }>>(
    `/analytics/project/${projectId}`
  );
  return res.data.data.analytics;
};
