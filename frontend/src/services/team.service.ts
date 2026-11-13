import api from "@/lib/axios";
import type {
  ApiResponse,
  AssignableRole,
  TeamResponse,
} from "@/types";

// Team Responsibility Management API calls (Module 2 Feature 4).

export const getTeam = async (projectId: number): Promise<TeamResponse> => {
  const res = await api.get<ApiResponse<TeamResponse>>(
    `/team/project/${projectId}`
  );
  return res.data.data;
};

export const updateMemberRole = async (
  projectId: number,
  userId: number,
  data: { role?: AssignableRole; responsibilities?: string }
): Promise<void> => {
  await api.patch(`/team/project/${projectId}/members/${userId}`, data);
};

export const updateMemberEvaluation = async (
  projectId: number,
  userId: number,
  data: { contributionScore?: number | null; contributionNotes?: string }
): Promise<void> => {
  await api.patch(
    `/team/project/${projectId}/members/${userId}/evaluation`,
    data
  );
};
