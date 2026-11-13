import api from "@/lib/axios";
import type {
  ApiResponse,
  JoinedProject,
  Milestone,
  MilestoneFormValues,
  ProjectMemberEntry,
  Task,
  TaskFormValues,
  TaskStatus,
  WorkspaceOverview,
} from "@/types";

// All Module 2 Feature 1 (Task & Milestone) API calls live here.

/* ---------- Tasks ---------- */

export const getTasks = async (projectId: number): Promise<Task[]> => {
  const res = await api.get<ApiResponse<{ tasks: Task[] }>>(
    `/tasks/project/${projectId}`
  );
  return res.data.data.tasks;
};

export const createTask = async (
  projectId: number,
  data: TaskFormValues
): Promise<Task> => {
  const res = await api.post<ApiResponse<{ task: Task }>>(
    `/tasks/project/${projectId}`,
    data
  );
  return res.data.data.task;
};

export const updateTask = async (
  taskId: number,
  data: Partial<TaskFormValues>
): Promise<Task> => {
  const res = await api.patch<ApiResponse<{ task: Task }>>(
    `/tasks/${taskId}`,
    data
  );
  return res.data.data.task;
};

export const updateTaskStatus = async (
  taskId: number,
  status: TaskStatus
): Promise<Task> => {
  const res = await api.patch<ApiResponse<{ task: Task }>>(
    `/tasks/${taskId}/status`,
    { status }
  );
  return res.data.data.task;
};

export const deleteTask = async (taskId: number): Promise<void> => {
  await api.delete(`/tasks/${taskId}`);
};

/* ---------- Milestones ---------- */

export const getMilestones = async (
  projectId: number
): Promise<Milestone[]> => {
  const res = await api.get<ApiResponse<{ milestones: Milestone[] }>>(
    `/milestones/project/${projectId}`
  );
  return res.data.data.milestones;
};

export const createMilestone = async (
  projectId: number,
  data: MilestoneFormValues
): Promise<Milestone> => {
  const res = await api.post<ApiResponse<{ milestone: Milestone }>>(
    `/milestones/project/${projectId}`,
    data
  );
  return res.data.data.milestone;
};

export const updateMilestone = async (
  milestoneId: number,
  data: Partial<MilestoneFormValues>
): Promise<Milestone> => {
  const res = await api.patch<ApiResponse<{ milestone: Milestone }>>(
    `/milestones/${milestoneId}`,
    data
  );
  return res.data.data.milestone;
};

export const deleteMilestone = async (milestoneId: number): Promise<void> => {
  await api.delete(`/milestones/${milestoneId}`);
};

/* ---------- Workspace ---------- */

export const getMembers = async (
  projectId: number
): Promise<ProjectMemberEntry[]> => {
  const res = await api.get<ApiResponse<{ members: ProjectMemberEntry[] }>>(
    `/workspace/project/${projectId}/members`
  );
  return res.data.data.members;
};

export const getOverview = async (
  projectId: number
): Promise<WorkspaceOverview> => {
  const res = await api.get<ApiResponse<{ overview: WorkspaceOverview }>>(
    `/workspace/project/${projectId}/overview`
  );
  return res.data.data.overview;
};

export const getJoinedProjects = async (): Promise<JoinedProject[]> => {
  const res = await api.get<ApiResponse<{ projects: JoinedProject[] }>>(
    "/workspace/joined"
  );
  return res.data.data.projects;
};
