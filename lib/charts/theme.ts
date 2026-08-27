import type { CSSProperties } from "react";

export const AXIS_COLOR = "#68645d";
export const GRID_COLOR = "#d8d3c9";
export const ACCENT_COLOR = "#0b6e69";
export const SIGNAL_COLOR = "#c85a3e";
export const POSITIVE_COLOR = "#3e7a4f";
export const NEGATIVE_COLOR = "#b23b3b";

export const CATEGORICAL_COLORS = ["#0b6e69", "#5b7a8c", "#b79a6b", "#8c6e4e", "#c85a3e"];

export const CHART_MARGIN = { top: 8, right: 12, bottom: 8, left: 4 };

export const AXIS_TICK_STYLE = { fill: AXIS_COLOR, fontSize: 12 };

export const TOOLTIP_CONTENT_STYLE: CSSProperties = {
  background: "#fcfbf8",
  border: "1px solid #d8d3c9",
  borderRadius: 6,
  fontSize: 12,
  color: "#141414",
  padding: "8px 10px",
  boxShadow: "none",
};

export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: "#68645d",
  fontSize: 11,
  marginBottom: 2,
};
