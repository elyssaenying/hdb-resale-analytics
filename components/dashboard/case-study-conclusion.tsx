import type { AnalyticsResponse } from "@/lib/analytics/build-response";
import { analyticalDecisions, skillsDemonstrated } from "@/lib/config";
import { BASELINE_YEAR } from "@/lib/constants";
import { formatPercent } from "@/lib/formatting";

interface CaseStudyConclusionProps {
  data: AnalyticsResponse;
}

export function CaseStudyConclusion({ data }: CaseStudyConclusionProps) {
  const priceGrowth = data.empty ? null : data.growth.priceGrowthPct;
  const latestCompleteYear = data.yearMeta.latestCompleteYear;

  return (
    <section aria-labelledby="conclusion-heading" className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6">
      <h2 id="conclusion-heading" className="text-lg font-semibold text-ink sm:text-xl">
        Conclusion
      </h2>
      <p className="mt-1 text-sm text-ink-muted">Based on unfiltered, national, complete-year figures.</p>
      <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-ink">
        <p>
          Singapore&apos;s HDB resale market repriced substantially between {BASELINE_YEAR} and{" "}
          {latestCompleteYear}{priceGrowth !== null ? ` (median price ${formatPercent(priceGrowth)})` : ""}, but
          that headline number hides meaningfully different outcomes by town and flat type. Price per sqm is a
          useful way to compare space against cost, but it is not a complete definition of value — it says
          nothing about amenities, accessibility, flat condition, or what a specific buyer needs. Appreciation
          was uneven across towns, and the towns that appreciated fastest were not necessarily the most
          expensive ones to begin with. Remaining lease and storey both show a consistent descriptive
          association with price per sqm, but this analysis does not isolate either as a cause. The
          million-dollar segment, while still a minority of transactions, has become a visibly larger part of
          the market since 2017.
        </p>
        <p>
          Taken together, this dashboard is most useful as an <strong>exploratory market-intelligence tool</strong>{" "}
          — for comparing segments, monitoring how the market moves year over year, and forming questions worth
          investigating further — rather than as a tool for valuing an individual flat, predicting future
          prices, or making a final purchase decision on its own.
        </p>
      </div>

      <h3 className="mt-8 text-base font-semibold text-ink">Analytical Decisions &amp; Trade-offs</h3>
      <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {analyticalDecisions.map((item) => (
          <div key={item.decision}>
            <dt className="text-sm font-medium text-ink">{item.decision}</dt>
            <dd className="mt-0.5 text-sm text-ink-muted">{item.reason}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-8 text-base font-semibold text-ink">What This Project Demonstrates</h3>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {skillsDemonstrated.map((skill) => (
          <li key={skill} className="flex gap-2.5 text-sm text-ink-muted">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span>{skill}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
