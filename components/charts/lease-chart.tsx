"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyChartState } from "@/components/dashboard/section";
import { LEASE_BANDS } from "@/lib/analytics/bands";
import type { LeaseBandRow, LeaseFlatTypeSelection } from "@/lib/analytics/metrics";
import { AXIS_TICK_STYLE, CATEGORICAL_COLORS, GRID_COLOR, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE } from "@/lib/charts/theme";
import { formatInteger, formatMoney } from "@/lib/formatting";

interface LeaseChartProps {
  rows: LeaseBandRow[];
  selection: LeaseFlatTypeSelection;
}

interface PivotedRow {
  leaseBand: string;
  [flatType: string]: string | number | null;
}

function pivotByType(rows: LeaseBandRow[], types: string[]): PivotedRow[] {
  return LEASE_BANDS.map((band) => {
    const entry: PivotedRow = { leaseBand: band };
    for (const type of types) {
      const match = rows.find((r) => r.leaseBand === band && r.flatType === type);
      entry[type] = match?.medianPpsm ?? null;
    }
    return entry;
  }).filter((entry) => types.some((t) => entry[t] !== null));
}

function GroupedTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div style={TOOLTIP_LABEL_STYLE}>Remaining lease: {label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ color: item.color }}>
          {item.dataKey}: {formatMoney(item.value)}
        </div>
      ))}
    </div>
  );
}

function SimpleTooltip({ active, payload }: { active?: boolean; payload?: { payload: LeaseBandRow }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div style={TOOLTIP_LABEL_STYLE}>Remaining lease: {row.leaseBand}</div>
      <div className="font-medium">{formatMoney(row.medianPpsm)} / sqm</div>
      <div className="text-ink-muted">{formatInteger(row.transactions)} transactions</div>
    </div>
  );
}

export function LeaseChart({ rows, selection }: LeaseChartProps) {
  if (rows.length === 0) {
    return <EmptyChartState message="No data available for the lease-band chart under current filters." />;
  }

  return (
    <div>
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {selection.groupByType ? (
            <BarChart data={pivotByType(rows, selection.types)} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="leaseBand" tick={AXIS_TICK_STYLE} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
              <YAxis
                tick={AXIS_TICK_STYLE}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                width={56}
              />
              <Tooltip content={<GroupedTooltip />} cursor={{ fill: "rgba(11,110,105,0.06)" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-muted)" }} />
              {selection.types.map((type, i) => (
                <Bar
                  key={type}
                  dataKey={type}
                  fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                  isAnimationActive
                  animationDuration={250}
                />
              ))}
            </BarChart>
          ) : (
            <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="leaseBand" tick={AXIS_TICK_STYLE} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
              <YAxis
                tick={AXIS_TICK_STYLE}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                width={56}
              />
              <Tooltip content={<SimpleTooltip />} cursor={{ fill: "rgba(11,110,105,0.06)" }} />
              <Bar dataKey="medianPpsm" fill={CATEGORICAL_COLORS[0]} radius={[3, 3, 0, 0]} maxBarSize={48} isAnimationActive animationDuration={250} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        This is an observed association, not a causal estimate. Remaining lease is also related to flat age,
        town, and flat model.
        {selection.note ? ` ${selection.note}` : ""}
      </p>
    </div>
  );
}
