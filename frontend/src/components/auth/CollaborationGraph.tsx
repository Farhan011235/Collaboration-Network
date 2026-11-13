// Decorative node-and-edge graph used on the auth screens.
// It is the product's own subject matter - researchers connected
// through shared projects - drawn as the thing it describes.
export function CollaborationGraph() {
  const nodes = [
    { cx: 60, cy: 70, r: 6 },
    { cx: 160, cy: 40, r: 9 },
    { cx: 250, cy: 100, r: 6 },
    { cx: 120, cy: 150, r: 13 },
    { cx: 230, cy: 210, r: 8 },
    { cx: 60, cy: 240, r: 6 },
    { cx: 170, cy: 300, r: 10 },
    { cx: 275, cy: 320, r: 6 },
    { cx: 95, cy: 370, r: 8 },
    { cx: 215, cy: 415, r: 6 },
  ];

  const edges = [
    [0, 1], [1, 2], [0, 3], [1, 3], [2, 4], [3, 4],
    [3, 5], [4, 6], [5, 6], [6, 7], [5, 8], [6, 8], [8, 9], [7, 9],
  ];

  return (
    <svg
      viewBox="0 0 320 460"
      className="h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx}
          y1={nodes[a].cy}
          x2={nodes[b].cx}
          y2={nodes[b].cy}
          stroke="currentColor"
          strokeWidth="1"
          className="text-white/25"
        />
      ))}
      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          className="fill-white/80"
        />
      ))}
    </svg>
  );
}
