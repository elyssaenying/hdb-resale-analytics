"use client";

import { motion, useReducedMotion } from "motion/react";
import { siteConfig } from "@/lib/config";
import type { YearlyTrendPoint } from "@/lib/analytics/metrics";

interface MastheadProps {
  latestMonth: { year: number; month: number };
  latestCompleteYear: number;
  yearlyActivity: YearlyTrendPoint[];
}

function formatMonth(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" });
}

/**
 * A single, nonessential, data-derived motion detail (per DESIGN.md):
 * a quiet row of blocks shaded by each complete year's real transaction
 * volume. Not decorative noise -- every block reflects an actual number.
 * Disabled entirely under prefers-reduced-motion.
 */
function ActivityMotif({ yearlyActivity }: { yearlyActivity: YearlyTrendPoint[] }) {
  const prefersReducedMotion = useReducedMotion();
  const complete = yearlyActivity.filter((p) => p.isCompleteYear);
  if (complete.length === 0) return null;

  const max = Math.max(...complete.map((p) => p.transactions));

  return (
    <div className="mt-8 flex items-end gap-1" aria-hidden="true">
      {complete.map((point, i) => {
        const heightPct = max > 0 ? Math.max(0.12, point.transactions / max) : 0.12;
        return (
          <motion.div
            key={point.year}
            // `initial` is intentionally identical for every render --
            // branching it on useReducedMotion() would make the SSR
            // markup disagree with the client's first render (the OS
            // motion preference isn't knowable during SSR), which React
            // will not reconcile after hydration. Only the transition
            // duration is safe to vary, since it isn't serialized into
            // the SSR'd inline style.
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.4, delay: 0.05 * i, ease: "easeOut" }
            }
            style={{ transformOrigin: "bottom" }}
            className="w-3 rounded-[2px] bg-masthead-ink-muted/40"
          >
            <div style={{ height: `${heightPct * 28}px` }} />
          </motion.div>
        );
      })}
    </div>
  );
}

export function Masthead({ latestMonth, latestCompleteYear, yearlyActivity }: MastheadProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <header className="bg-masthead text-masthead-ink">
      <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-masthead-ink-muted">
            {siteConfig.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem]">
            {siteConfig.title}
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-masthead-ink-muted sm:text-lg">
            {siteConfig.thesis}
          </p>

          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wide text-masthead-ink-muted">Source</dt>
              <dd className="mt-1 text-sm">{siteConfig.sourceLabel}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wide text-masthead-ink-muted">
                Latest available month
              </dt>
              <dd className="mt-1 font-mono text-sm tabular-nums">{formatMonth(latestMonth.year, latestMonth.month)}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wide text-masthead-ink-muted">
                Latest complete year
              </dt>
              <dd className="mt-1 font-mono text-sm tabular-nums">{latestCompleteYear}</dd>
            </div>
          </dl>

          <p className="mt-4 max-w-xl text-xs text-masthead-ink-muted">
            The latest month is excluded from every full-year comparison below, since it is
            still in progress.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {siteConfig.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[11px] text-masthead-ink-muted"
              >
                {tech}
              </span>
            ))}
          </div>

          <ActivityMotif yearlyActivity={yearlyActivity} />
        </motion.div>
      </div>
    </header>
  );
}
