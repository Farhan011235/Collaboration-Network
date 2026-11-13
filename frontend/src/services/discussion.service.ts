import api from "@/lib/axios";
import type {
  ApiResponse,
  DiscussionComment,
  DiscussionThread,
  DiscussionThreadDetail,
} from "@/types";

// Discussion board API calls (Module 2 Feature 2).

export const getThreads = async (
  projectId: number
): Promise<DiscussionThread[]> => {
  const res = await api.get<ApiResponse<{ threads: DiscussionThread[] }>>(
    `/discussions/project/${projectId}`
  );
  return res.data.data.threads;
};

export const createThread = async (
  projectId: number,
  data: { title: string; body: string }
): Promise<DiscussionThread> => {
  const res = await api.post<ApiResponse<{ thread: DiscussionThread }>>(
    `/discussions/project/${projectId}`,
    data
  );
  return res.data.data.thread;
};

export const getThread = async (
  threadId: number
): Promise<DiscussionThreadDetail> => {
  const res = await api.get<ApiResponse<{ thread: DiscussionThreadDetail }>>(
    `/discussions/thread/${threadId}`
  );
  return res.data.data.thread;
};

export const addComment = async (
  threadId: number,
  body: string
): Promise<DiscussionComment> => {
  const res = await api.post<ApiResponse<{ comment: DiscussionComment }>>(
    `/discussions/thread/${threadId}/comments`,
    { body }
  );
  return res.data.data.comment;
};

export const deleteThread = async (threadId: number): Promise<void> => {
  await api.delete(`/discussions/thread/${threadId}`);
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/discussions/comment/${commentId}`);
};
