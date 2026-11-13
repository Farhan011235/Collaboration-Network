import api from "@/lib/axios";
import type { ApiResponse, DocumentPayload, ProjectDocument } from "@/types";

// Document API calls (Module 2 Feature 3). Uploads use multipart FormData.

const toFormData = (data: DocumentPayload): FormData => {
  const fd = new FormData();
  if (data.title !== undefined) fd.append("title", data.title);
  if (data.description !== undefined)
    fd.append("description", data.description ?? "");
  if (data.category !== undefined) fd.append("category", data.category ?? "");
  if (data.file) fd.append("file", data.file);
  return fd;
};

export const getDocuments = async (
  projectId: number
): Promise<ProjectDocument[]> => {
  const res = await api.get<ApiResponse<{ documents: ProjectDocument[] }>>(
    `/documents/project/${projectId}`
  );
  return res.data.data.documents;
};

export const uploadDocument = async (
  projectId: number,
  data: DocumentPayload
): Promise<ProjectDocument> => {
  const res = await api.post<ApiResponse<{ document: ProjectDocument }>>(
    `/documents/project/${projectId}`,
    toFormData(data),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data.document;
};

export const updateDocument = async (
  documentId: number,
  data: DocumentPayload
): Promise<ProjectDocument> => {
  const res = await api.patch<ApiResponse<{ document: ProjectDocument }>>(
    `/documents/${documentId}`,
    toFormData(data),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data.document;
};

export const deleteDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};

// Fetches the file as a blob (so the auth header is sent) and triggers a
// browser download with the original filename.
export const downloadDocument = async (
  documentId: number,
  filename: string
): Promise<void> => {
  const res = await api.get(`/documents/${documentId}/download`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data as Blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
