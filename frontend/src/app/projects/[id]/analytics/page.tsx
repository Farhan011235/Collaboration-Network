"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  KanbanSquare,
  ListChecks,
  Flag,
  AlertTriangle,
  Users,
  MessageSquare,
  FileText,
  CalendarDays,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useLivePoll } from "@/hooks/useLivePoll";
import { useAuth } from "@/hooks/useAuth";
import * as projectService from "@/services/project.service";
import * as analyticsService from "@/services/analytics.service";
import * as reportService from "@/services/report.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/analytics/StatTile";
import { TaskStatusBar } from "@/components/analytics/TaskStatusBar";
import { CompletionTrend } from "@/components/analytics/CompletionTrend";
import { ContributionBars } from "@/components/analytics/ContributionBars";
import { MilestoneMeters } from "@/components/analytics/MilestoneMeters";
import type { ProjectAnalytics } from "@/types";

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-lg font-medium">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [data, setData] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isInteger(projectId)) return;
    Promise.all([
      projectService.getProject(projectId),
      analyticsService.getProjectAnalytics(projectId),
    ])
      .then(([project, analytics]) => {
        setTitle(project.title);
        setOwnerId(project.ownerId);
        setData(analytics);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  // Stats stay current as the team works, without a manual reload.
  const refresh = useCallback(async () => {
    if (!Number.isInteger(projectId)) return;
    try {
      setData(await analyticsService.getProjectAnalytics(projectId));
    } catch {
      /* transient poll failure - next tick retries */
    }
  }, [projectId]);

  useLivePoll(refresh, { enabled: Number.isInteger(projectId) });

  // Report generation is owner-only (Module 3 Feature 6).
  const isOwner = ownerId !== null && user?.userId === ownerId;

  const downloadReport = async () => {
    setDownloading(true);
    try {
      await reportService.downloadReportPdf(projectId);
      toast.success("Report downloaded");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-4xl flex-1 py-10">
          {loading || !data ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={`/projects/${projectId}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to project
                </Link>
                <Link
                  href={`/projects/${projectId}/workspace`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <KanbanSquare className="h-4 w-4" />
                  Workspace
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-medium tracking-tight">
                    Analytics
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{title}</p>
                </div>
                {isOwner && (
                  <Button size="sm" onClick={downloadReport} loading={downloading}>
                    <FileDown className="h-4 w-4" />
                    Download report
                  </Button>
                )}
              </div>

              {/* Hero figure - exactly one per view */}
              <div className="mt-8 rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">
                  Overall project progress
                </p>
                <p className="mt-1 text-5xl font-semibold leading-none">
                  {data.progress.completionPercent}
                  <span className="text-2xl text-muted-foreground">%</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {data.progress.completedTasks} of {data.progress.totalTasks}{" "}
                  tasks complete
                </p>
              </div>

              {/* KPI row */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Tasks completed"
                  value={data.progress.completedTasks}
                  hint={`of ${data.progress.totalTasks} total`}
                  icon={ListChecks}
                />
                <StatTile
                  label="Milestones pending"
                  value={data.milestones.pending}
                  hint={`${data.milestones.completed} of ${data.milestones.total} done`}
                  icon={Flag}
                />
                <StatTile
                  label="Overdue tasks"
                  value={data.progress.overdueTasks}
                  hint={
                    data.milestones.overdue > 0
                      ? `${data.milestones.overdue} milestone(s) overdue`
                      : "nothing past due"
                  }
                  icon={AlertTriangle}
                  tone={data.progress.overdueTasks > 0 ? "critical" : "default"}
                />
                <StatTile
                  label="Team members"
                  value={data.collaboration.members}
                  hint={`${data.collaboration.applications} request(s) received`}
                  icon={Users}
                />
              </div>

              <div className="mt-4 space-y-4">
                <Panel
                  title="Task breakdown"
                  subtitle="Where the project's work currently sits."
                >
                  <TaskStatusBar progress={data.progress} />
                </Panel>

                <Panel
                  title="Completed tasks over time"
                  subtitle="Cumulative completions across the last 30 days."
                >
                  <CompletionTrend timeline={data.timeline} />
                </Panel>

                <Panel
                  title="Milestone progress"
                  subtitle="Task completion within each project phase."
                >
                  <MilestoneMeters milestones={data.milestones.breakdown} />
                </Panel>

                <Panel
                  title="Team contributions"
                  subtitle="Activity score derived from tasks, discussions, documents and meetings."
                >
                  <ContributionBars contributions={data.contributions} />
                </Panel>

                <Panel
                  title="Collaboration statistics"
                  subtitle="How the team communicates and shares work."
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile
                      label="Discussions"
                      value={data.collaboration.threads}
                      icon={MessageSquare}
                    />
                    <StatTile
                      label="Replies"
                      value={data.collaboration.comments}
                      icon={MessageSquare}
                    />
                    <StatTile
                      label="Documents"
                      value={data.collaboration.documents}
                      icon={FileText}
                    />
                    <StatTile
                      label="Meetings"
                      value={data.collaboration.meetings}
                      icon={CalendarDays}
                    />
                  </div>
                </Panel>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
