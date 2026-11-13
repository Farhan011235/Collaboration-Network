import api from "@/lib/axios";
import type { ApiResponse, AuthPayload, LoginData, RegisterData, User } from "@/types";

// All auth API calls live here. Components never call axios directly.

export const registerUser = async (data: RegisterData): Promise<AuthPayload> => {
  const res = await api.post<ApiResponse<AuthPayload>>("/auth/register", data);
  return res.data.data;
};

export const loginUser = async (data: LoginData): Promise<AuthPayload> => {
  const res = await api.post<ApiResponse<AuthPayload>>("/auth/login", data);
  return res.data.data;
};

export const fetchCurrentUser = async (): Promise<User> => {
  const res = await api.get<ApiResponse<{ user: User }>>("/auth/me");
  return res.data.data.user;
};
