import { VIZ } from "./viz";
import type { AnalyticsContribution } from "@/types";

// Compare magnitude across members: a single-series bar chart, so one hue and
// no legend. Bars are <=24px thick with a 4px rounded data-end, grown from a
// single baseline, and each carries its value at the tip.
export function ContributionBars({
  contributions,
}: {
  contributions: AnalyticsContribution[];
}) {
  if (contributions.length === 0) return null;
  const max = Math.max(...contributions.map((c) => c.score), 1);

  return (
    <ul className="space-y-3">
      {contributions.map((c) => (
        <li key={c.userId}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium">{c.fullName}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {c.sharePercent}% of activity
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-5 flex-1 rounded-sm bg-muted/60">
              <div
                className="h-5 rounded-r-[4px]"
                style={{
                  width: `${Math.max(2, (c.score / max) * 100)}%`,
                  backgroundColor: VIZ.todo,
                }}
                title={`${c.fullName}: activity score ${c.score}`}
              />
            </div>
            <span
              className="w-6 shrink-0 text-right text-xs font-medium text-foreground"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {c.score}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {c.tasksCompleted}/{c.tasksAssigned} tasks · {c.threads} posts ·{" "}
            {c.comments} replies · {c.documents} docs · {c.meetings} meetings
          </p>
        </li>
      ))}
    </ul>
  );
}
