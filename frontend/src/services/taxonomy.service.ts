import api from "@/lib/axios";
import type { ApiResponse, Interest, Skill } from "@/types";

export const getSkills = async (search?: string): Promise<Skill[]> => {
  const res = await api.get<ApiResponse<{ skills: Skill[] }>>("/taxonomy/skills", {
    params: search ? { search } : undefined,
  });
  return res.data.data.skills;
};

export const getInterests = async (search?: string): Promise<Interest[]> => {
  const res = await api.get<ApiResponse<{ interests: Interest[] }>>(
    "/taxonomy/interests",
    { params: search ? { search } : undefined }
  );
  return res.data.data.interests;
};

export const getResearchDomains = async (): Promise<string[]> => {
  const res = await api.get<ApiResponse<{ domains: string[] }>>("/taxonomy/domains");
  return res.data.data.domains;
};
