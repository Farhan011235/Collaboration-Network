"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Inbox, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import * as projectService from "@/services/project.service";
import * as applicationService from "@/services/application.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplicantReviewCard } from "@/components/projects/ApplicantReviewCard";
import { useLivePoll } from "@/hooks/useLivePoll";
import type {
  ApplicationDecision,
  ApplicationStatus,
  Project,
  ProjectApplication,
} from "@/types";

type Tab = "PENDING" | "ACCEPTED" | "REJECTED";
const tabs: { label: string; value: Tab }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Declined", value: "REJECTED" },
];

export default function ReviewRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [tab, setTab] = useState<Tab>("PENDING");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<{
    id: number;
    decision: ApplicationDecision;
  } | null>(null);

  useEffect(() => {
    if (!Number.isInteger(projectId)) return;

    Promise.all([
      projectService.getProject(projectId),
      applicationService.getProjectApplications(projectId),
    ])
      .then(([proj, apps]) => {
        setProject(proj);
        setMemberCount(proj._count.members);
        setApplications(apps);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        router.push("/my-projects");
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  // Silent background refresh so new collaboration requests appear without a
  // manual reload. Skipped while a decision is in flight so it can't clobber
  // the optimistic status update mid-review.
  const refresh = useCallback(async () => {
    if (!Number.isInteger(projectId) || processing) return;
    try {
      const [proj, apps] = await Promise.all([
        projectService.getProject(projectId),
        applicationService.getProjectApplications(projectId),
      ]);
      setProject(proj);
      setMemberCount(proj._count.members);
      setApplications(apps);
    } catch {
      // Ignore transient poll failures; the next tick retries.
    }
  }, [projectId, processing]);

  useLivePoll(refresh, { enabled: Number.isInteger(projectId) });

  const counts = useMemo(() => {
    const base: Record<Tab, number> = { PENDING: 0, ACCEPTED: 0, REJECTED: 0 };
    for (const a of applications) {
      if (a.status in base) base[a.status as Tab] += 1;
    }
    return base;
  }, [applications]);

  const visible = applications.filter((a) => a.status === tab);

  const teamFull =
    !!project?.teamSizeLimit && memberCount >= project.teamSizeLimit;

  const decide = async (
    applicationId: number,
    decision: ApplicationDecision
  ) => {
    setProcessing({ id: applicationId, decision });
    try {
      await applicationService.reviewApplication(applicationId, decision);

      const newStatus: ApplicationStatus =
        decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";

      setApplications((prev) =>
        prev.map((a) =>
          a.applicationId === applicationId ? { ...a, status: newStatus } : a
        )
      );

      if (decision === "ACCEPT") {
        setMemberCount((c) => c + 1);
        toast.success("Applicant added to the team");
      } else {
        toast.success("Request declined");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-3xl flex-1 py-10">
          {loading || !project ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Link
                href={`/projects/${projectId}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to project
              </Link>

              <header className="mt-4">
                <h1 className="font-display text-3xl font-medium tracking-tight">
                  Collaboration requests
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{project.title}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {memberCount} on the team
                  {project.teamSizeLimit ? ` of ${project.teamSizeLimit}` : ""}
                </p>
              </header>

              <div className="mt-8 flex gap-1 border-b border-border">
                {tabs.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className={cn(
                      "-mb-px border-b-2 px-4 py-2 text-sm transition-colors",
                      tab === t.value
                        ? "border-primary font-medium text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {counts[t.value]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                {visible.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title={
                      tab === "PENDING"
                        ? "No pending requests"
                        : tab === "ACCEPTED"
                        ? "No one accepted yet"
                        : "No declined requests"
                    }
                    body={
                      tab === "PENDING"
                        ? "When researchers request to collaborate, they'll show up here for you to review."
                        : "Requests you act on will move here."
                    }
                  />
                ) : (
                  visible.map((application) => (
                    <ApplicantReviewCard
                      key={application.applicationId}
                      application={application}
                      onDecision={decide}
                      busy={
                        processing?.id === application.applicationId
                          ? processing.decision
                          : null
                      }
                      teamFull={teamFull}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
