"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyChartState } from "@/components/dashboard/section";
import type { TownStat } from "@/lib/analytics/metrics";
import { ACCENT_COLOR, AXIS_TICK_STYLE, GRID_COLOR, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE } from "@/lib/charts/theme";
import { formatInteger, formatMoney } from "@/lib/formatting";

interface TownComparisonChartProps {
  townStats: TownStat[];
}

interface TooltipPayloadItem {
  payload: TownStat;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const stat = payload[0]?.payload;
  if (!stat) return null;

  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div style={TOOLTIP_LABEL_STYLE}>{stat.town}</div>
      <div className="font-medium">{formatMoney(stat.medianPpsm)} / sqm</div>
      <div className="text-ink-muted">{formatMoney(stat.medianPrice)} median price</div>
      <div className="text-ink-muted">{formatInteger(stat.transactions)} transactions</div>
    </div>
  );
}

export function TownComparisonChart({ townStats }: TownComparisonChartProps) {
  if (townStats.length === 0) {
    return <EmptyChartState message="No town data available under current filters." />;
  }

  const height = Math.max(360, townStats.length * 26);

  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={townStats} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
            <XAxis
              type="number"
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="town"
              tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={128}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(11,110,105,0.06)" }} />
            <Bar dataKey="medianPpsm" fill={ACCENT_COLOR} radius={[0, 3, 3, 0]} maxBarSize={16} isAnimationActive animationDuration={250} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        Lower price per sqm means more floor area per dollar, but does not account for location, flat age,
        amenities, or other buyer preferences.
      </p>
    </div>
  );
}
