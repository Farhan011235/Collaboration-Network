"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Loader2, KanbanSquare, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import * as workspaceService from "@/services/workspace.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { EmptyState } from "@/components/ui/empty-state";
import type { JoinedProject } from "@/types";

export default function MyTeamsPage() {
  const [projects, setProjects] = useState<JoinedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workspaceService
      .getJoinedProjects()
      .then(setProjects)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container flex-1 py-10">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight">
              Teams you&apos;re on
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Projects you joined as a collaborator. Open a workspace to see its
              tasks and milestones.
            </p>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                icon={Users}
                title="You haven't joined any teams yet"
                body="When a project owner accepts your request to collaborate, that project shows up here."
                actionLabel="Discover projects"
                actionHref="/projects"
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {projects.map((project) => (
                  <Link
                    key={project.projectId}
                    href={`/projects/${project.projectId}/workspace`}
                    className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-lg font-medium leading-snug group-hover:text-primary">
                          {project.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {project.researchDomain} · {project.owner.fullName}
                        </p>
                      </div>
                      <KanbanSquare className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project._count.members} in team
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="h-3 w-3" />
                        {project._count.tasks} tasks
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
