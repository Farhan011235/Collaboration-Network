import api from "@/lib/axios";
import type { ApiResponse, RecommendedProject } from "@/types";

// Project Recommendation API calls (Module 3 Feature 2).

export const getRecommendations = async (): Promise<RecommendedProject[]> => {
  const res = await api.get<ApiResponse<{ projects: RecommendedProject[] }>>(
    "/recommendations"
  );
  return res.data.data.projects;
};
