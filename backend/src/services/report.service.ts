import PDFDocument from "pdfkit";
import * as reportModel from "../models/report.model";
import { buildProjectAnalytics } from "./analytics.service";

// SERVICE LAYER - Project Report Generation (Module 3 Feature 6).
// Reuses the Feature 4 analytics figures so the report and the dashboard can
// never disagree, then renders them as a downloadable PDF. No external API.

// Same palette as the analytics dashboard, so both tell the same visual story.
const COLOR = {
  ink: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  rule: "#d8d7d0",
  todo: "#2a78d6",
  inProgress: "#eb6834",
  done: "#1baf7a",
  critical: "#d03b3b",
  track: "#eceae4",
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

// Roles read better title-cased, and "Data Analyst" fits the column where
// "DATA ANALYST" wrapped onto a second line.
const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  RESEARCH_LEAD: "Research Lead",
  DEVELOPER: "Developer",
  DATA_ANALYST: "Data Analyst",
  WRITER: "Writer",
  MEMBER: "Member",
};

const fmtDate = (d?: Date | string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const getReportData = async (projectId: number) => {
  const [project, analytics, tasks] = await Promise.all([
    reportModel.getProjectHeader(projectId),
    buildProjectAnalytics(projectId),
    reportModel.getTasksForReport(projectId),
  ]);
  return { project, analytics, tasks };
};

export type ReportData = Awaited<ReturnType<typeof getReportData>>;

// Builds the PDF. The caller pipes the returned document to the response.
export const renderReportPdf = (data: ReportData): PDFKit.PDFDocument => {
  const { project, analytics, tasks } = data;
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });

  const LEFT = doc.page.margins.left;
  const RIGHT = doc.page.width - doc.page.margins.right;
  const WIDTH = RIGHT - LEFT;
  const BOTTOM = doc.page.height - doc.page.margins.bottom;

  // ---- small layout helpers -------------------------------------------
  const ensure = (needed: number) => {
    if (doc.y + needed > BOTTOM) doc.addPage();
  };

  const rule = () => {
    doc
      .moveTo(LEFT, doc.y)
      .lineTo(RIGHT, doc.y)
      .lineWidth(0.5)
      .strokeColor(COLOR.rule)
      .stroke();
    doc.moveDown(0.8);
  };

  const heading = (text: string) => {
    ensure(60);
    doc.moveDown(0.6);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(COLOR.ink).text(text);
    doc.moveDown(0.4);
    rule();
  };

  const label = (text: string, value: string) => {
    doc.font("Helvetica").fontSize(9).fillColor(COLOR.muted).text(text, { continued: true });
    doc.font("Helvetica-Bold").fillColor(COLOR.ink).text(`  ${value}`);
    doc.moveDown(0.15);
  };

  // A horizontal proportion bar (used for completion + milestones).
  const progressBar = (percent: number, width = WIDTH, height = 8) => {
    const x = LEFT;
    const y = doc.y;
    doc.roundedRect(x, y, width, height, height / 2).fillColor(COLOR.track).fill();
    if (percent > 0) {
      const w = Math.max(height, (width * Math.min(100, percent)) / 100);
      doc.roundedRect(x, y, w, height, height / 2).fillColor(COLOR.done).fill();
    }
    doc.x = LEFT;
    doc.y = y + height + 6;
  };

  // Simple fixed-column table row.
  const row = (
    cells: string[],
    widths: number[],
    opts: { bold?: boolean; color?: string; size?: number } = {}
  ) => {
    const size = opts.size ?? 9;
    ensure(18);
    const y = doc.y;
    let x = LEFT;
    doc
      .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(size)
      .fillColor(opts.color ?? COLOR.ink);
    cells.forEach((cell, i) => {
      doc.text(cell, x, y, { width: widths[i] - 6, ellipsis: true, lineBreak: false });
      x += widths[i];
    });
    // Positioned text leaves the cursor at the last column; put it back or
    // every following paragraph wraps into a narrow right-hand column.
    doc.x = LEFT;
    doc.y = y + size + 6;
  };

  // ---- cover / header --------------------------------------------------
  doc.font("Helvetica-Bold").fontSize(20).fillColor(COLOR.ink);
  doc.text("Project Progress Report");
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(11).fillColor(COLOR.secondary);
  doc.text(project?.title ?? "Untitled project");
  doc.moveDown(0.2);
  doc.fontSize(9).fillColor(COLOR.muted);
  doc.text(`Generated ${fmtDate(new Date())}`);
  doc.moveDown(0.8);
  rule();

  // ---- project overview -------------------------------------------------
  heading("Project overview");
  label("Owner", project?.owner?.fullName ?? "—");
  if (project?.owner?.institution) label("Institution", project.owner.institution);
  label("Research domain", project?.researchDomain ?? "—");
  label("Collaboration", project?.collaborationType ?? "—");
  label("Status", project?.status ?? "—");
  label(
    "Duration",
    project?.durationMonths ? `${project.durationMonths} months` : "Not specified"
  );
  label("Started", fmtDate(project?.publishedAt ?? project?.createdAt));

  if (project?.description) {
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(9).fillColor(COLOR.secondary);
    doc.text(project.description, { width: WIDTH, align: "left" });
  }

  // ---- executive summary ------------------------------------------------
  const p = analytics.progress;
  heading("Progress summary");

  doc.font("Helvetica-Bold").fontSize(28).fillColor(COLOR.ink);
  doc.text(`${p.completionPercent}%`, { continued: true });
  doc.font("Helvetica").fontSize(10).fillColor(COLOR.muted);
  doc.text(`   ${p.completedTasks} of ${p.totalTasks} tasks complete`);
  // The 28pt hero number needs real clearance before the bar, or the bar
  // rides up into its descender.
  doc.moveDown(1.4);
  progressBar(p.completionPercent);
  doc.moveDown(0.8);

  row(["To do", "In progress", "Done", "Overdue"], [WIDTH / 4, WIDTH / 4, WIDTH / 4, WIDTH / 4], {
    bold: true,
    color: COLOR.muted,
    size: 8,
  });
  row(
    [
      String(p.tasks.TODO),
      String(p.tasks.IN_PROGRESS),
      String(p.tasks.DONE),
      String(p.overdueTasks),
    ],
    [WIDTH / 4, WIDTH / 4, WIDTH / 4, WIDTH / 4],
    { bold: true, size: 13 }
  );

  if (p.overdueTasks > 0) {
    doc.font("Helvetica").fontSize(9).fillColor(COLOR.critical);
    doc.text(`${p.overdueTasks} task(s) are past their due date.`);
  }

  // ---- milestones -------------------------------------------------------
  const ms = analytics.milestones;
  heading("Milestones");
  doc.font("Helvetica").fontSize(9).fillColor(COLOR.secondary);
  doc.text(
    `${ms.completed} of ${ms.total} complete · ${ms.pending} pending · ${ms.overdue} overdue`
  );
  doc.moveDown(0.5);

  if (ms.breakdown.length === 0) {
    doc.fillColor(COLOR.muted).text("No milestones defined.");
  } else {
    const w = [WIDTH * 0.42, WIDTH * 0.18, WIDTH * 0.18, WIDTH * 0.22];
    row(["Milestone", "Due", "Tasks", "Status"], w, {
      bold: true,
      color: COLOR.muted,
      size: 8,
    });
    ms.breakdown.forEach((m) => {
      const status = m.isOverdue
        ? "Overdue"
        : m.status === "COMPLETED"
        ? "Complete"
        : "Pending";
      row(
        [
          m.title,
          fmtDate(m.dueDate),
          `${m.taskDone}/${m.taskTotal}`,
          `${status} (${m.completionPercent}%)`,
        ],
        w,
        { color: m.isOverdue ? COLOR.critical : COLOR.ink }
      );
    });
  }

  // ---- team contributions ----------------------------------------------
  heading("Team contributions");
  doc.font("Helvetica").fontSize(8).fillColor(COLOR.muted);
  doc.text(
    "Activity score = tasks completed x3, other assigned tasks x1, discussions x2, replies x1, documents x2, meetings x2."
  );
  doc.moveDown(0.5);

  const cw = [
    WIDTH * 0.22,
    WIDTH * 0.18,
    WIDTH * 0.1,
    WIDTH * 0.1,
    WIDTH * 0.1,
    WIDTH * 0.1,
    WIDTH * 0.1,
    WIDTH * 0.1,
  ];
  row(
    ["Member", "Role", "Tasks", "Done", "Posts", "Docs", "Score", "Share"],
    cw,
    { bold: true, color: COLOR.muted, size: 8 }
  );
  analytics.contributions.forEach((c) => {
    row(
      [
        c.fullName,
        ROLE_LABEL[String(c.role)] ?? String(c.role),
        String(c.tasksAssigned),
        String(c.tasksCompleted),
        String(c.threads + c.comments),
        String(c.documents),
        String(c.score),
        `${c.sharePercent}%`,
      ],
      cw
    );
  });

  // ---- collaboration activity ------------------------------------------
  const col = analytics.collaboration;
  heading("Collaboration activity");
  const aw = [WIDTH / 5, WIDTH / 5, WIDTH / 5, WIDTH / 5, WIDTH / 5];
  row(["Members", "Discussions", "Replies", "Documents", "Meetings"], aw, {
    bold: true,
    color: COLOR.muted,
    size: 8,
  });
  row(
    [
      String(col.members),
      String(col.threads),
      String(col.comments),
      String(col.documents),
      String(col.meetings),
    ],
    aw,
    { bold: true, size: 12 }
  );

  // ---- task detail ------------------------------------------------------
  heading("Task detail");
  if (tasks.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor(COLOR.muted).text("No tasks yet.");
  } else {
    // Group by milestone so the report reads as a plan, not a flat list.
    const groups = new Map<string, typeof tasks>();
    tasks.forEach((t) => {
      const key = t.milestone?.title ?? "Unassigned to a milestone";
      const arr = groups.get(key) ?? [];
      arr.push(t);
      groups.set(key, arr);
    });

    const tw = [WIDTH * 0.42, WIDTH * 0.18, WIDTH * 0.16, WIDTH * 0.12, WIDTH * 0.12];
    groups.forEach((list, milestoneTitle) => {
      ensure(50);
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR.ink).text(milestoneTitle);
      doc.moveDown(0.2);
      row(["Task", "Assignee", "Status", "Priority", "Due"], tw, {
        bold: true,
        color: COLOR.muted,
        size: 8,
      });
      list.forEach((t) => {
        const overdue =
          t.status !== "DONE" && !!t.dueDate && new Date(t.dueDate) < new Date();
        row(
          [
            t.title,
            t.assignee?.fullName ?? "Unassigned",
            STATUS_LABEL[t.status] ?? t.status,
            t.priority,
            fmtDate(t.dueDate),
          ],
          tw,
          { color: overdue ? COLOR.critical : COLOR.ink }
        );
      });
    });
  }

  // ---- page footers -----------------------------------------------------
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    // Writing below the bottom margin would trigger a fresh page per footer,
    // so the margin is dropped for the duration of the footer pass.
    const keepBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - keepBottom + 12;
    doc.font("Helvetica").fontSize(8).fillColor(COLOR.muted);
    doc.text(
      `${project?.title ?? "Project"} · Research & Project Collaboration Network`,
      LEFT,
      y,
      { width: WIDTH * 0.7, lineBreak: false }
    );
    doc.text(`Page ${i + 1} of ${range.count}`, LEFT + WIDTH * 0.7, y, {
      width: WIDTH * 0.3,
      align: "right",
      lineBreak: false,
    });
    doc.page.margins.bottom = keepBottom;
  }

  doc.end();
  return doc;
};

// A filesystem-safe filename like "bengali-asr-progress-report-2026-08-18.pdf".
export const reportFileName = (title?: string | null) => {
  const slug = (title ?? "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "project";
  return `${slug}-progress-report-${new Date().toISOString().slice(0, 10)}.pdf`;
};
