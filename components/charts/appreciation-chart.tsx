"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyChartState } from "@/components/dashboard/section";
import type { AppreciationResult } from "@/lib/analytics/metrics";
import { ACCENT_COLOR, AXIS_TICK_STYLE, GRID_COLOR, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE } from "@/lib/charts/theme";
import { APPRECIATION_MIN_N, BASELINE_YEAR } from "@/lib/constants";
import { formatInteger, formatMoney, formatPercent } from "@/lib/formatting";

interface AppreciationChartProps {
  appreciation: AppreciationResult;
  latestCompleteYear: number;
}

interface TooltipPayloadItem {
  payload: AppreciationResult["qualified"][number];
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const stat = payload[0]?.payload;
  if (!stat) return null;

  return (
    <div style={TOOLTIP_CONTENT_STYLE}>
      <div style={TOOLTIP_LABEL_STYLE}>{stat.town}</div>
      <div className="font-medium">{formatPercent(stat.growthPct)} growth</div>
      <div className="text-ink-muted">
        {formatMoney(stat.price2017)} ({formatInteger(stat.txn2017)} txns) → {formatMoney(stat.priceLatest)} (
        {formatInteger(stat.txnLatest)} txns)
      </div>
    </div>
  );
}

export function AppreciationChart({ appreciation, latestCompleteYear }: AppreciationChartProps) {
  if (appreciation.insufficientData) {
    return (
      <EmptyChartState
        message={`No towns have at least ${APPRECIATION_MIN_N} transactions in both ${BASELINE_YEAR} and ${latestCompleteYear} under the current filters, so a stable appreciation ranking cannot be shown.`}
      />
    );
  }

  const height = Math.max(360, appreciation.qualified.length * 26);

  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={appreciation.qualified} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
            <XAxis
              type="number"
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
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
            <Bar dataKey="growthPct" fill={ACCENT_COLOR} radius={[0, 3, 3, 0]} maxBarSize={16} isAnimationActive animationDuration={250} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        Only towns with ≥{APPRECIATION_MIN_N} transactions in both {BASELINE_YEAR} and {latestCompleteYear} are
        shown ({appreciation.qualifiedCount} of {appreciation.totalTownCount} towns with data in both years
        qualified).
      </p>
    </div>
  );
}
