import api from "@/lib/axios";
import type { ApiResponse, Meeting, MeetingFormValues } from "@/types";

// Meeting Scheduler API calls (Module 3 Feature 1).

export const getMeetings = async (projectId: number): Promise<Meeting[]> => {
  const res = await api.get<ApiResponse<{ meetings: Meeting[] }>>(
    `/meetings/project/${projectId}`
  );
  return res.data.data.meetings;
};

export const createMeeting = async (
  projectId: number,
  data: MeetingFormValues
): Promise<Meeting> => {
  const res = await api.post<ApiResponse<{ meeting: Meeting }>>(
    `/meetings/project/${projectId}`,
    data
  );
  return res.data.data.meeting;
};

export const updateMeeting = async (
  meetingId: number,
  data: Partial<MeetingFormValues>
): Promise<Meeting> => {
  const res = await api.patch<ApiResponse<{ meeting: Meeting }>>(
    `/meetings/${meetingId}`,
    data
  );
  return res.data.data.meeting;
};

export const deleteMeeting = async (meetingId: number): Promise<void> => {
  await api.delete(`/meetings/${meetingId}`);
};

// Add an already-scheduled meeting to my own Google Calendar (after I connect).
export const syncMeeting = async (meetingId: number): Promise<void> => {
  await api.post(`/meetings/${meetingId}/sync`);
};
