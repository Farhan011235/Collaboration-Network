"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useLivePoll } from "@/hooks/useLivePoll";
import * as recommendationService from "@/services/recommendation.service";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { EmptyState } from "@/components/ui/empty-state";
import { RecommendationCard } from "@/components/projects/RecommendationCard";
import type { RecommendedProject } from "@/types";

export default function RecommendationsPage() {
  const [projects, setProjects] = useState<RecommendedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationService
      .getRecommendations()
      .then(setProjects)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  // Keep the list fresh as new projects are published / your teams change.
  const refresh = useCallback(async () => {
    try {
      setProjects(await recommendationService.getRecommendations());
    } catch {
      /* transient poll failure - next tick retries */
    }
  }, []);

  useLivePoll(refresh);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container flex-1 py-10">
          <div>
            <h1 className="inline-flex items-center gap-2 font-display text-3xl font-medium tracking-tight">
              <Sparkles className="h-6 w-6 text-primary" />
              Recommended for you
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Published projects matched to your skills and research interests,
              inferred from the projects you own, joined, and applied to.
            </p>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No recommendations yet"
                body="Create or join a project, or apply to one, and we'll match you to similar research. The more you engage, the better the matches."
                actionLabel="Discover projects"
                actionHref="/projects"
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {projects.map((project) => (
                  <RecommendationCard
                    key={project.projectId}
                    project={project}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
