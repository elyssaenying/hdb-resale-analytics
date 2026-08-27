"use client";

import { useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyChartState } from "@/components/dashboard/section";
import type { GrowthCaption, YearlyTrendPoint } from "@/lib/analytics/metrics";
import { ACCENT_COLOR, AXIS_TICK_STYLE, GRID_COLOR, SIGNAL_COLOR, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE } from "@/lib/charts/theme";
import { formatInteger, formatMoney, formatPercent } from "@/lib/formatting";
import { BASELINE_YEAR } from "@/lib/constants";

interface MarketTrendChartProps {
  trend: YearlyTrendPoint[];
  growth: GrowthCaption;
  latestCompleteYear: number;
}

type Metric = "medianPrice" | "medianPpsm";

const METRIC_LABEL: Record<Metric, string> = {
  medianPrice: "Median resale price",
  medianPpsm: "Median price per sqm",
};

interface TooltipPayloadItem {
  payload: YearlyTrendPoint;
}

function ChartTooltip({ active, payload, metric }: { active?: boolean; payload?: TooltipPayloadItem[]; metric: Metric }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div style={TOOLTIP_LABEL_STYLE}>
        Year {point.year}
        {!point.isCompleteYear ? " (partial/YTD)" : ""}
      </div>
      <div className="font-medium">{formatMoney(point[metric])}</div>
      <div className="text-ink-muted">{formatInteger(point.transactions)} transactions</div>
    </div>
  );
}

export function MarketTrendChart({ trend, growth, latestCompleteYear }: MarketTrendChartProps) {
  const [metric, setMetric] = useState<Metric>("medianPrice");

  if (trend.length === 0) {
    return <EmptyChartState message="No data available for the trend chart under current filters." />;
  }

  const completePoints = trend.filter((p) => p.isCompleteYear);
  const partialPoints = trend.filter((p) => !p.isCompleteYear);
  const lastComplete = completePoints[completePoints.length - 1];
  const bridgePoints = lastComplete ? [lastComplete, ...partialPoints] : partialPoints;

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-md border border-border bg-surface p-1 text-sm" role="radiogroup" aria-label="Metric">
        {(Object.keys(METRIC_LABEL) as Metric[]).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={metric === key}
            onClick={() => setMetric(key)}
            className="rounded px-3 py-1.5 transition-colors"
            style={{
              background: metric === key ? "var(--accent)" : "transparent",
              color: metric === key ? "var(--accent-ink)" : "var(--ink-muted)",
            }}
          >
            {METRIC_LABEL[key]}
          </button>
        ))}
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={AXIS_TICK_STYLE}
              axisLine={{ stroke: GRID_COLOR }}
              tickLine={false}
              allowDuplicatedCategory={false}
            />
            <YAxis
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              width={56}
            />
            <Tooltip content={<ChartTooltip metric={metric} />} />
            <Line
              data={completePoints}
              type="monotone"
              dataKey={metric}
              name="Complete years"
              stroke={ACCENT_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: ACCENT_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={250}
            />
            {bridgePoints.length > 1 && (
              <Line
                data={bridgePoints}
                type="monotone"
                dataKey={metric}
                name="Partial/YTD"
                stroke={SIGNAL_COLOR}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                legendType="none"
                isAnimationActive={false}
              />
            )}
            {partialPoints.length > 0 && (
              <Scatter data={partialPoints} dataKey={metric} fill={SIGNAL_COLOR} shape="diamond" legendType="none" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: ACCENT_COLOR }} />
          Complete years
        </span>
        {partialPoints.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rotate-45" style={{ background: SIGNAL_COLOR }} />
            Partial/YTD (not a full-year comparison)
          </span>
        )}
      </div>

      <p className="mt-4 text-sm text-ink">
        {growth.hasData ? (
          <>
            {BASELINE_YEAR} → {latestCompleteYear} growth: median price{" "}
            <span className="tabular-nums font-medium">{formatPercent(growth.priceGrowthPct)}</span>, median
            price/sqm <span className="tabular-nums font-medium">{formatPercent(growth.ppsmGrowthPct)}</span>.
          </>
        ) : (
          <>
            Not enough data in both {BASELINE_YEAR} and {latestCompleteYear} under current filters to compute
            growth.
          </>
        )}
      </p>
    </div>
  );
}
