import { STATUS_SERIES, VIZ } from "./viz";
import type { AnalyticsProgress } from "@/types";

// Part-to-whole: one horizontal stacked bar. Three series, so a legend is
// always present; segments are direct-labelled where the text fits.
// Segments are separated by a 2px surface gap (flex gap), never a stroke.
export function TaskStatusBar({ progress }: { progress: AnalyticsProgress }) {
  const total = progress.totalTasks;

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tasks yet — the breakdown appears once the team adds work.
      </p>
    );
  }

  return (
    <div>
      <div className="flex h-6 w-full gap-[2px] overflow-hidden">
        {STATUS_SERIES.map((s, i) => {
          const count = progress.tasks[s.key];
          if (count === 0) return null;
          const share = (count / total) * 100;
          // Only label inside the segment when the text comfortably fits.
          const showLabel = share >= 12;
          return (
            <div
              key={s.key}
              style={{
                width: `${share}%`,
                backgroundColor: s.color,
                borderTopLeftRadius: i === 0 ? 4 : 0,
                borderBottomLeftRadius: i === 0 ? 4 : 0,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
              }}
              className="flex items-center justify-center"
              title={`${s.label}: ${count} of ${total} tasks`}
            >
              {showLabel && (
                <span className="text-xs font-medium text-white">{count}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend - identity is never colour-alone */}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {STATUS_SERIES.map((s) => (
          <li
            key={s.key}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.label}
            <span className="font-medium text-foreground">
              {progress.tasks[s.key]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
