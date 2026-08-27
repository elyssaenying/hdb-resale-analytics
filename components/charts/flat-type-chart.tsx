"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyChartState } from "@/components/dashboard/section";
import type { FlatTypeStat } from "@/lib/analytics/metrics";
import { ACCENT_COLOR, AXIS_TICK_STYLE, GRID_COLOR, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE } from "@/lib/charts/theme";
import { formatInteger, formatMoney } from "@/lib/formatting";

interface FlatTypeChartProps {
  flatTypeStats: FlatTypeStat[];
}

interface TooltipPayloadItem {
  payload: FlatTypeStat;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const stat = payload[0]?.payload;
  if (!stat) return null;

  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div style={TOOLTIP_LABEL_STYLE}>{stat.flatType}</div>
      <div className="font-medium">{formatMoney(stat.medianPrice)} median price</div>
      <div className="text-ink-muted">{formatMoney(stat.medianPpsm)} / sqm</div>
      <div className="text-ink-muted">{stat.medianFloorArea?.toFixed(0) ?? "N/A"} sqm median floor area</div>
      <div className="text-ink-muted">{formatInteger(stat.transactions)} transactions</div>
    </div>
  );
}

export function FlatTypeChart({ flatTypeStats }: FlatTypeChartProps) {
  if (flatTypeStats.length === 0) {
    return <EmptyChartState message="No flat type data available under current filters." />;
  }

  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={flatTypeStats} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="flatType" tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
          <YAxis
            tick={AXIS_TICK_STYLE}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            width={56}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(11,110,105,0.06)" }} />
          <Bar dataKey="medianPrice" fill={ACCENT_COLOR} radius={[3, 3, 0, 0]} maxBarSize={56} isAnimationActive animationDuration={250} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
