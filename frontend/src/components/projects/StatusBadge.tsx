import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/types";

const config: Record<ProjectStatus, { label: string; variant: "default" | "muted" | "outline" | "warning" }> = {
  DRAFT: { label: "Draft", variant: "muted" },
  PUBLISHED: { label: "Published", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "warning" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
