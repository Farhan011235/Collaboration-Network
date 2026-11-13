"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, KanbanSquare, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLivePoll } from "@/hooks/useLivePoll";
import * as projectService from "@/services/project.service";
import * as teamService from "@/services/team.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import type { TeamMember } from "@/types";

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = Number(params.id);

  const [title, setTitle] = useState("");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isInteger(projectId)) return;
    Promise.all([
      projectService.getProject(projectId),
      teamService.getTeam(projectId),
    ])
      .then(([project, res]) => {
        setTitle(project.title);
        setTeam(res.team);
        setIsOwner(res.isOwner);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  // Silent refresh so role changes and new activity show up without a reload.
  const refresh = useCallback(async () => {
    if (!Number.isInteger(projectId)) return;
    try {
      const res = await teamService.getTeam(projectId);
      setTeam(res.team);
      setIsOwner(res.isOwner);
    } catch {
      /* transient poll failure - next tick retries */
    }
  }, [projectId]);

  useLivePoll(refresh, { enabled: Number.isInteger(projectId) });

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-3xl flex-1 py-10">
          {loading ? (
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Link
                    href={`/projects/${projectId}/workspace`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <KanbanSquare className="h-4 w-4" />
                    Workspace
                  </Link>
                  <Link
                    href={`/projects/${projectId}/analytics`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Link>
                </div>
              </div>

              <div className="mt-4">
                <h1 className="inline-flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
                  <Users className="h-6 w-6 text-primary" />
                  Team
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{title}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isOwner
                    ? "Assign each member a project role and responsibilities, and record how they're contributing."
                    : "Who's on this team and what each person is responsible for."}
                </p>
              </div>

              <ul className="mt-8 space-y-3">
                {team.map((m) => (
                  <TeamMemberCard
                    key={m.userId}
                    member={m}
                    projectId={projectId}
                    isOwner={isOwner}
                    isSelf={m.userId === user?.userId}
                    onChanged={refresh}
                  />
                ))}
              </ul>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
