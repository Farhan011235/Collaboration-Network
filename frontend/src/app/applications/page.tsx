"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import * as applicationService from "@/services/application.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { Application, ApplicationStatus } from "@/types";

const statusStyle: Record<
  ApplicationStatus,
  { label: string; variant: "default" | "secondary" | "muted" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  ACCEPTED: { label: "Accepted", variant: "default" },
  REJECTED: { label: "Declined", variant: "muted" },
  WITHDRAWN: { label: "Withdrawn", variant: "muted" },
};

export default function MyRequestsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationService
      .getMyApplications()
      .then(setApplications)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-3xl flex-1 py-10">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight">
              Your requests
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Collaboration requests you&apos;ve sent to project owners.
            </p>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : applications.length === 0 ? (
              <EmptyState
                icon={Send}
                title="No requests yet"
                body="Browse open projects and request to collaborate on the ones that fit."
                actionLabel="Discover projects"
                actionHref="/projects"
              />
            ) : (
              <ul className="space-y-3">
                {applications.map((app) => {
                  const style = statusStyle[app.status];
                  return (
                    <li key={app.applicationId}>
                      <Link
                        href={`/projects/${app.projectId}`}
                        className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-display text-lg font-medium leading-snug">
                              {app.project.title}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {app.project.researchDomain} ·{" "}
                              {app.project.owner.fullName}
                            </p>
                          </div>
                          <Badge variant={style.variant}>{style.label}</Badge>
                        </div>

                        {app.message && (
                          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                            &ldquo;{app.message}&rdquo;
                          </p>
                        )}

                        <p className="mt-3 text-xs text-muted-foreground">
                          Sent {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
