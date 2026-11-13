import { VIZ } from "./viz";

// Trend over time: cumulative tasks completed. A single series, so there is no
// legend - the title says what is plotted - and only the endpoint is labelled.
// 2px line, 10% area wash, hairline gridlines, end dot with a surface ring.
export function CompletionTrend({
  timeline,
}: {
  timeline: { date: string; completed: number; cumulative: number }[];
}) {
  if (timeline.length === 0) return null;

  const W = 720;
  const H = 190;
  const PAD = { top: 14, right: 52, bottom: 24, left: 34 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxRaw = Math.max(...timeline.map((t) => t.cumulative), 1);
  // Round the axis up to a clean number.
  const step = maxRaw <= 5 ? 1 : maxRaw <= 20 ? 5 : maxRaw <= 100 ? 10 : 50;
  const max = Math.ceil(maxRaw / step) * step;

  const x = (i: number) =>
    PAD.left + (i / Math.max(1, timeline.length - 1)) * plotW;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const line = timeline
    .map((t, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(t.cumulative).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(timeline.length - 1).toFixed(1)},${PAD.top + plotH} L${PAD.left},${PAD.top + plotH} Z`;

  const ticks = [0, max / 2, max];
  const last = timeline[timeline.length - 1];
  const fmt = (d: string) =>
    new Date(d + "T00:00:00Z").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Cumulative tasks completed over the last ${timeline.length} days, ending at ${last.cumulative}`}
      >
        {/* gridlines - recessive, hairline, solid */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke={VIZ.grid}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(t) + 3.5}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}
            >
              {t}
            </text>
          </g>
        ))}

        <path d={area} fill={VIZ.done} fillOpacity={0.1} />
        <path
          d={line}
          fill="none"
          stroke={VIZ.done}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* end marker: >=8px, 2px surface ring */}
        <circle
          cx={x(timeline.length - 1)}
          cy={y(last.cumulative)}
          r={4}
          fill={VIZ.done}
          stroke={VIZ.surface}
          strokeWidth={2}
        />
        {/* the one direct label */}
        <text
          x={x(timeline.length - 1) + 10}
          y={y(last.cumulative) + 4}
          className="fill-foreground"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          {last.cumulative}
        </text>

        {/* x-axis endpoints only */}
        <text
          x={PAD.left}
          y={H - 6}
          className="fill-muted-foreground"
          style={{ fontSize: 10 }}
        >
          {fmt(timeline[0].date)}
        </text>
        <text
          x={W - PAD.right}
          y={H - 6}
          textAnchor="end"
          className="fill-muted-foreground"
          style={{ fontSize: 10 }}
        >
          {fmt(last.date)}
        </text>
      </svg>
    </figure>
  );
}
