"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import * as projectService from "@/services/project.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { StatusBadge } from "@/components/projects/StatusBadge";
import type { Project } from "@/types";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const projectId = Number(params.id);

  useEffect(() => {
    if (!Number.isInteger(projectId)) return;

    projectService
      .getProject(projectId)
      .then(setProject)
      .catch((error) => {
        toast.error(getErrorMessage(error));
        router.push("/my-projects");
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

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

              <header className="mb-8 mt-4 flex items-center gap-3">
                <h1 className="font-display text-3xl font-medium tracking-tight">
                  Edit project
                </h1>
                <StatusBadge status={project.status} />
              </header>

              {project.status === "PUBLISHED" && (
                <p className="mb-8 rounded-md border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground">
                  This project is live. Changes are visible to everyone straight away.
                </p>
              )}

              <ProjectForm existing={project} />
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
