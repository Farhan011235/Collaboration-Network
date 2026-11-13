import api from "@/lib/axios";
import type { ApiResponse, GoogleStatus } from "@/types";

// Google Calendar connection API calls (Module 3 Feature 1).

export const getStatus = async (): Promise<GoogleStatus> => {
  const res = await api.get<ApiResponse<GoogleStatus>>("/google/status");
  return res.data.data;
};

// Returns the Google consent URL to send the browser to. `redirect` is the
// in-app path to return to once the connection completes.
export const getAuthUrl = async (redirect?: string): Promise<string> => {
  const res = await api.get<ApiResponse<{ url: string }>>("/google/auth-url", {
    params: redirect ? { redirect } : undefined,
  });
  return res.data.data.url;
};

export const disconnect = async (): Promise<void> => {
  await api.delete("/google/disconnect");
};
