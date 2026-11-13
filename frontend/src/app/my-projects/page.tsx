"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderPlus, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import * as projectService from "@/services/project.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project, ProjectStatus } from "@/types";

const tabs: { label: string; value: ProjectStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Drafts", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
];

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    projectService
      .getMyProjects(filter === "ALL" ? undefined : filter)
      .then(setProjects)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container flex-1 py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-medium tracking-tight">
                Your projects
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Proposals you own, from first draft to archive.
              </p>
            </div>

            <Button asChild>
              <Link href="/projects/create">
                <Plus className="h-4 w-4" />
                New project
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex gap-1 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm transition-colors",
                  filter === tab.value
                    ? "border-primary font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                icon={FolderPlus}
                title={filter === "ALL" ? "No projects yet" : "Nothing here"}
                body={
                  filter === "ALL"
                    ? "Post a research proposal and start finding collaborators who match the work."
                    : "Try a different tab, or start a new proposal."
                }
                actionLabel="Create a project"
                actionHref="/projects/create"
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.projectId} project={project} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
