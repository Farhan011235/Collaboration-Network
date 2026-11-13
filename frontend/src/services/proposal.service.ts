import api from "@/lib/axios";
import type { ApiResponse, ProposalAnalysis } from "@/types";

// Proposal Quality Assistant API calls (Module 3 Feature 3).

export const getStatus = async (): Promise<{ configured: boolean }> => {
  const res = await api.get<ApiResponse<{ configured: boolean }>>(
    "/proposals/status"
  );
  return res.data.data;
};

export const analyzeProposal = async (
  projectId: number
): Promise<ProposalAnalysis> => {
  const res = await api.post<ApiResponse<{ analysis: ProposalAnalysis }>>(
    `/proposals/${projectId}/analyze`
  );
  return res.data.data.analysis;
};
