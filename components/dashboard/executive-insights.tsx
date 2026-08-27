import type { AnalyticsResponse } from "@/lib/analytics/build-response";
import { APPRECIATION_MIN_N, BASELINE_YEAR, MILLION_DOLLAR_THRESHOLD } from "@/lib/constants";
import { formatMoney, formatPercent, formatPercentPlain } from "@/lib/formatting";

interface ExecutiveInsightsProps {
  data: AnalyticsResponse;
}

interface Insight {
  label: string;
  body: string;
}

/**
 * Four evidence-based takeaways, always computed from the unfiltered
 * national dataset (the same `initialData` the KPI snapshot's default
 * values come from) -- never the filter-reactive analytics response.
 * This is a presentational read of already-computed, already-tested
 * numbers; no new analytical logic lives here.
 */
export function ExecutiveInsights({ data }: ExecutiveInsightsProps) {
  if (data.empty) return null;

  const insights: Insight[] = [];
  const { growth, townStats, appreciation, millionDollarByYear, yearMeta } = data;
  const latestCompleteYear = yearMeta.latestCompleteYear;

  if (growth.hasData) {
    insights.push({
      label: "Market repricing",
      body: `Median resale price rose from ${formatMoney(growth.price2017)} in ${BASELINE_YEAR} to ${formatMoney(growth.priceLatest)} in ${latestCompleteYear} (${formatPercent(growth.priceGrowthPct)}). Median price per sqm rose ${formatPercent(growth.ppsmGrowthPct)} over the same span.`,
    });
  }

  if (townStats.length >= 2) {
    const cheapest = townStats[0];
    const priciest = townStats[townStats.length - 1];
    if (cheapest && priciest) {
      insights.push({
        label: "Geographic price-and-space trade-offs",
        body: `Pooled median price per sqm ranges from ${formatMoney(cheapest.medianPpsm)} in ${cheapest.town} to ${formatMoney(priciest.medianPpsm)} in ${priciest.town}. Lower price per sqm can mean more floor area per dollar, but it does not account for amenities, accessibility, flat age, or buyer preference.`,
      });
    }
  }

  if (appreciation.qualified.length >= 2) {
    const lowest = appreciation.qualified[0];
    const highest = appreciation.qualified[appreciation.qualified.length - 1];
    if (lowest && highest) {
      insights.push({
        label: "Uneven town appreciation",
        body: `Among towns with at least ${APPRECIATION_MIN_N} transactions in both ${BASELINE_YEAR} and ${latestCompleteYear}, median-price growth ranged from ${formatPercent(lowest.growthPct)} (${lowest.town}) to ${formatPercent(highest.growthPct)} (${highest.town}).`,
      });
    }
  }

  const baselineShare = millionDollarByYear.find((y) => y.year === BASELINE_YEAR);
  const latestShare = millionDollarByYear.find((y) => y.year === latestCompleteYear);
  if (baselineShare && latestShare) {
    const pointChange = latestShare.sharePct - baselineShare.sharePct;
    insights.push({
      label: "Expansion of the million-dollar segment",
      body: `Transactions at or above ${formatMoney(MILLION_DOLLAR_THRESHOLD)} grew from ${formatPercentPlain(baselineShare.sharePct)} of trades in ${BASELINE_YEAR} to ${formatPercentPlain(latestShare.sharePct)} in ${latestCompleteYear} — a rise of approximately ${pointChange.toFixed(2)} percentage points.`,
    });
  }

  if (insights.length === 0) return null;

  return (
    <section aria-labelledby="insights-heading" className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6">
      <h2 id="insights-heading" className="text-lg font-semibold text-ink sm:text-xl">
        What the Data Shows
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Unfiltered, national findings across complete calendar years — these do not change with the filters
        below.
      </p>

      <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.label} className="border-t border-border pt-4">
            <dt className="font-mono text-[11px] uppercase tracking-wide text-accent">{insight.label}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-ink">{insight.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
