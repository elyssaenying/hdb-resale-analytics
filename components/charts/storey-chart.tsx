"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyChartState } from "@/components/dashboard/section";
import type { StoreyBandRow } from "@/lib/analytics/metrics";
import { AXIS_TICK_STYLE, CATEGORICAL_COLORS, GRID_COLOR, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE } from "@/lib/charts/theme";
import { formatInteger, formatMoney } from "@/lib/formatting";

interface StoreyChartProps {
  storeyStats: StoreyBandRow[];
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: StoreyBandRow }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div style={TOOLTIP_LABEL_STYLE}>{row.storeyBand}</div>
      <div className="font-medium">{formatMoney(row.medianPpsm)} / sqm</div>
      <div className="text-ink-muted">{formatInteger(row.transactions)} transactions</div>
    </div>
  );
}

export function StoreyChart({ storeyStats }: StoreyChartProps) {
  if (storeyStats.length === 0) {
    return <EmptyChartState message="No data available for the storey-band chart under current filters." />;
  }

  return (
    <div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={storeyStats} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="storeyBand" tick={AXIS_TICK_STYLE} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
            <YAxis
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              width={56}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(11,110,105,0.06)" }} />
            <Bar dataKey="medianPpsm" fill={CATEGORICAL_COLORS[1]} radius={[3, 3, 0, 0]} maxBarSize={64} isAnimationActive animationDuration={250} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        Higher-storey differences are descriptive associations. This analysis does not estimate an isolated
        causal storey premium.
      </p>
    </div>
  );
}
