import Link from "next/link";
import { Clock, MapPin, Users, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecommendedProject } from "@/types";

const collaborationLabel = {
  REMOTE: "Remote",
  ONSITE: "On campus",
  HYBRID: "Hybrid",
} as const;

// A discovery card with the "why we matched you" reasons layered on top.
export function RecommendationCard({
  project,
}: {
  project: RecommendedProject;
}) {
  const { recommendation: rec } = project;

  return (
    <Link
      href={`/projects/${project.projectId}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-lg font-medium leading-snug group-hover:text-primary">
          {project.title}
        </h3>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          {rec.matchPercent}% match
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {project.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {project.researchDomain}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {collaborationLabel[project.collaborationType]}
        </span>
        {project.durationMonths && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {project.durationMonths} months
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" />
          {project._count.members} in team
        </span>
      </div>

      {(rec.matchedSkills.length > 0 || rec.matchedInterests.length > 0) && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Why this fits you
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rec.matchedSkills.map((s) => (
              <Badge key={`s-${s.skillId}`} variant="secondary">
                {s.name}
                {/* Proficiency only exists for skills on your portfolio. */}
                {s.proficiencyLevel && (
                  <span className="ml-1 opacity-70">
                    · {s.proficiencyLevel.charAt(0)}
                    {s.proficiencyLevel.slice(1).toLowerCase()}
                  </span>
                )}
              </Badge>
            ))}
            {rec.matchedInterests.map((i) => (
              <Badge key={`i-${i}`} variant="muted">
                {i}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
