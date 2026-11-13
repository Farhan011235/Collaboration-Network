import { Request, Response } from "express";
import * as reportService from "../services/report.service";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

// CONTROLLER LAYER - Project Report Generation (Module 3 Feature 6).
// Ownership is enforced by requireProjectOwner on the route.

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest("Invalid id");
  }
  return id;
};

// On-screen preview of what the PDF will contain.
export const getReportPreview = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.id);
    const data = await reportService.getReportData(projectId);
    if (!data.project) {
      throw ApiError.notFound("Project not found");
    }
    return sendSuccess(res, { report: data });
  }
);

// Streams the generated PDF as a file download.
export const downloadReportPdf = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = parseId(req.params.id);

    const data = await reportService.getReportData(projectId);
    if (!data.project) {
      throw ApiError.notFound("Project not found");
    }

    const fileName = reportService.reportFileName(data.project.title);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    // The browser needs to read the filename when the response is fetched
    // via XHR rather than a plain link.
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    const pdf = reportService.renderReportPdf(data);
    pdf.pipe(res);
  }
);
