import api from "@/lib/axios";

// Project Report Generation API calls (Module 3 Feature 6).

// Pulls the filename the server chose out of the Content-Disposition header,
// falling back to a sensible default.
const filenameFrom = (disposition?: string): string => {
  const match = disposition?.match(/filename="?([^"]+)"?/);
  return match?.[1] ?? "project-progress-report.pdf";
};

// Downloads the generated PDF and hands it to the browser as a file.
export const downloadReportPdf = async (projectId: number): Promise<void> => {
  const res = await api.get(`/reports/project/${projectId}/pdf`, {
    responseType: "blob",
  });

  const filename = filenameFrom(
    res.headers["content-disposition"] as string | undefined
  );

  const url = URL.createObjectURL(res.data as Blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
