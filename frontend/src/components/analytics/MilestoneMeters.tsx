import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { VIZ } from "./viz";
import type { AnalyticsMilestone } from "@/types";

// One meter per milestone. The unfilled track is a lighter step of the same
// blue ramp, so the state reads across the whole bar. "Overdue" is a status,
// so it ships with an icon + label - never colour alone.
export function MilestoneMeters({
  milestones,
}: {
  milestones: AnalyticsMilestone[];
}) {
  if (milestones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No milestones yet — add one to track project phases.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {milestones.map((m) => (
        <li key={m.milestoneId}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              {m.status === "COMPLETED" && (
                <CheckCircle2
                  className="h-3.5 w-3.5"
                  style={{ color: VIZ.done }}
                />
              )}
              {m.title}
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              {m.isOverdue && (
                <span
                  className="inline-flex items-center gap-1 font-medium"
                  style={{ color: VIZ.critical }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Overdue
                </span>
              )}
              {m.dueDate && (
                <span>{new Date(m.dueDate).toLocaleDateString()}</span>
              )}
              <span className="font-medium text-foreground">
                {m.taskDone}/{m.taskTotal} tasks
              </span>
            </span>
          </div>
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: VIZ.track }}
          >
            <div
              className="h-2 rounded-r-[4px]"
              style={{
                width: `${m.completionPercent}%`,
                backgroundColor:
                  m.status === "COMPLETED" ? VIZ.done : VIZ.todo,
              }}
              title={`${m.title}: ${m.completionPercent}% of tasks done`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
