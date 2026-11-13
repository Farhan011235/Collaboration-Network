"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Users, Loader2, MessageSquare, FileText, Calendar, BarChart3, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import * as projectService from "@/services/project.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { ProjectActions } from "@/components/projects/ProjectActions";
import { RequestCollaboration } from "@/components/projects/RequestCollaboration";
import { ProposalQualityAssistant } from "@/components/projects/ProposalQualityAssistant";
import type { ImportanceLevel, Project } from "@/types";

const collaborationLabel = {
  REMOTE: "Remote",
  ONSITE: "On campus",
  HYBRID: "Hybrid",
} as const;

const importanceLabel: Record<ImportanceLevel, string> = {
  REQUIRED: "Required",
  PREFERRED: "Preferred",
  OPTIONAL: "Nice to have",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

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
        router.push("/projects");
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  const isOwner = !!project && !!user && project.ownerId === user.userId;

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
                href={isOwner ? "/my-projects" : "/projects"}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {isOwner ? "Your projects" : "Discover projects"}
              </Link>

              <header className="mt-4 border-b border-border pb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={project.status} />
                  <span className="text-sm text-muted-foreground">
                    {project.researchDomain}
                  </span>
                </div>

                <h1 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight">
                  {project.title}
                </h1>

                <p className="mt-3 text-sm text-muted-foreground">
                  {project.owner.fullName}
                  {project.owner.institution ? ` · ${project.owner.institution}` : ""}
                </p>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {collaborationLabel[project.collaborationType]}
                  </span>
                  {project.durationMonths && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {project.durationMonths} months
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {project._count.members} in team
                    {project.teamSizeLimit ? ` of ${project.teamSizeLimit}` : ""}
                  </span>
                </div>

                {isOwner ? (
                  <div className="mt-6 space-y-3">
                    <ProjectActions project={project} onUpdated={setProject} />
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${project.projectId}/discussion`}>
                          <MessageSquare className="h-4 w-4" />
                          Discussion
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${project.projectId}/documents`}>
                          <FileText className="h-4 w-4" />
                          Documents
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${project.projectId}/meetings`}>
                          <Calendar className="h-4 w-4" />
                          Meetings
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${project.projectId}/team`}>
                          <UsersRound className="h-4 w-4" />
                          Team
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${project.projectId}/analytics`}>
                          <BarChart3 className="h-4 w-4" />
                          Analytics
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : project.status === "PUBLISHED" ? (
                  <div className="mt-6">
                    <RequestCollaboration project={project} />
                  </div>
                ) : null}
              </header>

              <div className="space-y-8 py-8">
                {isOwner && (
                  <ProposalQualityAssistant projectId={project.projectId} />
                )}
                <section>
                  <h2 className="font-display text-lg font-medium">About this project</h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">
                    {project.description}
                  </p>
                </section>

                {project.objectives && (
                  <section>
                    <h2 className="font-display text-lg font-medium">Objectives</h2>
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">
                      {project.objectives}
                    </p>
                  </section>
                )}

                {project.expectedOutcomes && (
                  <section>
                    <h2 className="font-display text-lg font-medium">Expected outcomes</h2>
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">
                      {project.expectedOutcomes}
                    </p>
                  </section>
                )}

                {project.skillRequirements.length > 0 && (
                  <section>
                    <h2 className="font-display text-lg font-medium">Skills needed</h2>
                    <ul className="mt-4 space-y-2">
                      {project.skillRequirements.map((req) => (
                        <li
                          key={req.skillId}
                          className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2.5"
                        >
                          <span className="text-sm font-medium">{req.skill.name}</span>
                          <Badge
                            variant={
                              req.importanceLevel === "REQUIRED" ? "default" : "muted"
                            }
                          >
                            {importanceLabel[req.importanceLevel]}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
