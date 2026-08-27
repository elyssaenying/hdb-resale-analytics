"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppreciationChart } from "@/components/charts/appreciation-chart";
import { FlatTypeChart } from "@/components/charts/flat-type-chart";
import { LeaseChart } from "@/components/charts/lease-chart";
import { MarketTrendChart } from "@/components/charts/market-trend-chart";
import { MillionDollarChart } from "@/components/charts/million-dollar-chart";
import { StoreyChart } from "@/components/charts/storey-chart";
import { TownComparisonChart } from "@/components/charts/town-comparison-chart";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { MarketSnapshot } from "@/components/dashboard/market-snapshot";
import { Masthead } from "@/components/dashboard/masthead";
import { Methodology } from "@/components/dashboard/methodology";
import { Section } from "@/components/dashboard/section";
import type { AnalyticsResponse } from "@/lib/analytics/build-response";
import type { FilterState } from "@/lib/analytics/types";
import { useAnalyticsData } from "@/lib/hooks/use-analytics-data";

interface DashboardShellProps {
  initialData: AnalyticsResponse;
  allTowns: string[];
  allFlatTypes: string[];
}

function readFiltersFromUrl(
  searchParams: URLSearchParams,
  allTowns: string[],
  allFlatTypes: string[],
): FilterState {
  const towns = searchParams.getAll("town").filter((t) => allTowns.includes(t));
  const flatTypes = searchParams.getAll("flatType").filter((t) => allFlatTypes.includes(t));
  return {
    towns: towns.length > 0 ? towns : allTowns,
    flatTypes: flatTypes.length > 0 ? flatTypes : allFlatTypes,
    includePartial: searchParams.get("includePartial") === "true",
  };
}

function writeFiltersToUrl(filters: FilterState, allTowns: string[], allFlatTypes: string[]): string {
  const params = new URLSearchParams();
  if (filters.towns.length !== allTowns.length) {
    for (const t of filters.towns) params.append("town", t);
  }
  if (filters.flatTypes.length !== allFlatTypes.length) {
    for (const t of filters.flatTypes) params.append("flatType", t);
  }
  if (filters.includePartial) params.set("includePartial", "true");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function DashboardShell({ initialData, allTowns, allFlatTypes }: DashboardShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(() =>
    readFiltersFromUrl(searchParams, allTowns, allFlatTypes),
  );

  const { data } = useAnalyticsData(filters, allTowns, allFlatTypes, initialData);

  useEffect(() => {
    const url = writeFiltersToUrl(filters, allTowns, allFlatTypes);
    router.replace(url || "?", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.towns.join(","), filters.flatTypes.join(","), filters.includePartial]);

  function handleReset() {
    setFilters({ towns: allTowns, flatTypes: allFlatTypes, includePartial: false });
  }

  return (
    <>
      <Masthead
        latestMonth={data.yearMeta.latestMonth}
        latestCompleteYear={data.yearMeta.latestCompleteYear}
        yearlyActivity={data.empty ? [] : data.trend}
      />

      <FilterBar
        allTowns={allTowns}
        allFlatTypes={allFlatTypes}
        filters={filters}
        onChange={setFilters}
        onReset={handleReset}
      />

      <main id="main-content">
        {data.empty ? (
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6">
            <div className="rounded-md border border-dashed border-border bg-surface px-6 py-10 text-center">
              <p className="text-sm text-ink">
                {data.reason === "no-towns" && "Select at least one town to see results."}
                {data.reason === "no-flat-types" && "Select at least one flat type to see results."}
                {data.reason === "no-rows" && "No transactions match the current combination of filters."}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 rounded-md border border-border bg-canvas px-3 py-1.5 text-sm text-ink hover:border-ink-muted"
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <MarketSnapshot kpi={data.kpi} />

            <Section
              id="trend"
              title="Market Trend Since 2017"
              question="How has the resale market changed since 2017?"
            >
              <MarketTrendChart
                trend={data.trend}
                growth={data.growth}
                latestCompleteYear={data.yearMeta.latestCompleteYear}
              />
            </Section>

            <Section
              id="towns"
              title="Median Price per sqm by Town"
              question="Which towns are relatively more or less expensive per sqm?"
            >
              <TownComparisonChart townStats={data.townStats} />
            </Section>

            <div className="mx-auto grid max-w-[1320px] gap-0 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8">
              <Section
                id="flat-types"
                title="Flat Type Comparison"
                question="How do HDB flat types differ in price and size?"
                className="!px-0"
              >
                <FlatTypeChart flatTypeStats={data.flatTypeStats} />
              </Section>

              <Section
                id="appreciation"
                title="Town Appreciation"
                question="Which towns experienced the strongest median-price growth since 2017?"
                className="!px-0"
              >
                <AppreciationChart appreciation={data.appreciation} latestCompleteYear={data.yearMeta.latestCompleteYear} />
              </Section>
            </div>

            <div className="mx-auto grid max-w-[1320px] gap-0 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8">
              <Section
                id="lease"
                title="Remaining Lease vs Price per sqm"
                question="How is remaining lease associated with price per sqm?"
                className="!px-0"
              >
                <LeaseChart rows={data.leaseBands.rows} selection={data.leaseBands.selection} />
              </Section>

              <Section
                id="storey"
                title="Storey Band vs Price per sqm"
                question="Are higher-storey flats associated with higher price per sqm?"
                className="!px-0"
              >
                <StoreyChart storeyStats={data.storeyStats} />
              </Section>
            </div>

            <Section
              id="million-dollar"
              title="Million-Dollar Transaction Share"
              question="Share of transactions at or above $1,000,000, by complete year."
            >
              <MillionDollarChart data={data.millionDollarByYear} />
            </Section>
          </>
        )}

        <Methodology />
      </main>
    </>
  );
}
