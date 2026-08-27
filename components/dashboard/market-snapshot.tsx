"use client";

import { motion, useReducedMotion } from "motion/react";
import type { KpiSnapshot } from "@/lib/analytics/metrics";
import { formatInteger, formatMoney, formatPercentPlain } from "@/lib/formatting";

interface MarketSnapshotProps {
  kpi: KpiSnapshot;
}

const CELLS = [
  { key: "medianPrice" as const, label: "Median Resale Price" },
  { key: "medianPpsm" as const, label: "Median Price / sqm" },
  { key: "transactions" as const, label: "Transactions" },
  { key: "millionDollarSharePct" as const, label: "Million-Dollar Share" },
];

export function MarketSnapshot({ kpi }: MarketSnapshotProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section aria-labelledby="snapshot-heading" className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6">
      <h2 id="snapshot-heading" className="text-lg font-semibold text-ink sm:text-xl">
        {kpi.year} Market Snapshot
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        The latest complete calendar year, under the current filters.
      </p>

      <div className="mt-5 grid grid-cols-2 divide-y divide-border rounded-lg border border-border bg-surface sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {CELLS.map((cell, i) => {
          const raw = kpi[cell.key];
          const display =
            cell.key === "transactions"
              ? formatInteger(raw)
              : cell.key === "millionDollarSharePct"
                ? formatPercentPlain(raw)
                : formatMoney(raw);

          return (
            <div key={cell.key} className={`px-5 py-5 ${i % 2 === 1 ? "border-l border-border sm:border-l-0" : ""}`}>
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">{cell.label}</p>
              <motion.p
                key={`${cell.key}-${display}`}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-ink sm:text-[1.75rem]"
              >
                {display}
              </motion.p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
