"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyChartState } from "@/components/dashboard/section";
import type { MillionDollarYear } from "@/lib/analytics/metrics";
import { AXIS_TICK_STYLE, GRID_COLOR, SIGNAL_COLOR, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE } from "@/lib/charts/theme";
import { formatInteger, formatPercentPlain } from "@/lib/formatting";

interface MillionDollarChartProps {
  data: MillionDollarYear[];
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: MillionDollarYear }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div style={TOOLTIP_LABEL_STYLE}>{row.year}</div>
      <div className="font-medium">{formatPercentPlain(row.sharePct)} of transactions</div>
      <div className="text-ink-muted">
        {formatInteger(row.millionDollar)} of {formatInteger(row.transactions)}
      </div>
    </div>
  );
}

export function MillionDollarChart({ data }: MillionDollarChartProps) {
  if (data.length === 0) {
    return <EmptyChartState message="No data available for the million-dollar share chart under current filters." />;
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="year" tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
          <YAxis
            tick={AXIS_TICK_STYLE}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            width={40}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(200,90,62,0.06)" }} />
          <Bar dataKey="sharePct" fill={SIGNAL_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive animationDuration={250} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
