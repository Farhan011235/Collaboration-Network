// Chart palette for the Analytics Dashboard (Module 3 Feature 4).
// Validated with the data-viz palette checker against the app's white card
// surface: adjacent CVD ΔE 9.2, normal-vision ΔE 27.6, all checks pass.
// The one contrast warning (aqua at 2.82:1) is relieved by direct labels -
// every segment and bar in this dashboard carries a visible value.

export const VIZ = {
  // Categorical slots - task status identity.
  todo: "#2a78d6", // slot 1, blue
  inProgress: "#eb6834", // slot 2, orange
  done: "#1baf7a", // slot 3, aqua
  // Status role - reserved, always shipped with an icon + label.
  critical: "#d03b3b",
  // Chart chrome.
  surface: "#ffffff",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  track: "#cde2fb", // lighter step of the blue ramp, for meter tracks
} as const;

export const STATUS_SERIES = [
  { key: "TODO", label: "To do", color: VIZ.todo },
  { key: "IN_PROGRESS", label: "In progress", color: VIZ.inProgress },
  { key: "DONE", label: "Done", color: VIZ.done },
] as const;
