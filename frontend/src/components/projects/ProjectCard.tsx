import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/projects/StatusBadge";
import type { Project } from "@/types";

const collaborationLabel = {
  REMOTE: "Remote",
  ONSITE: "On campus",
  HYBRID: "Hybrid",
} as const;

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.projectId}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-lg font-medium leading-snug group-hover:text-primary">
          {project.title}
        </h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {project.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{project.researchDomain}</span>
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

      {project.skillRequirements.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.skillRequirements.slice(0, 4).map((req) => (
            <Badge key={req.skillId} variant="secondary">
              {req.skill.name}
            </Badge>
          ))}
          {project.skillRequirements.length > 4 && (
            <Badge variant="muted">+{project.skillRequirements.length - 4}</Badge>
          )}
        </div>
      )}
    </Link>
  );
}
