import { describe, expect, it } from "vitest";
import { buildAnalyticsResponse } from "@/lib/analytics/build-response";
import { getYearMetadata } from "@/lib/analytics/complete-years";
import { applyFilters } from "@/lib/analytics/filters";
import {
  computeGrowthCaption,
  computeKpiSnapshot,
  computeMillionDollarByYear,
  computeTownAppreciation,
  computeYearlyTrend,
  resolveLeaseFlatTypes,
} from "@/lib/analytics/metrics";
import { loadDataset } from "@/lib/data/loader";

/**
 * Validates the ported TypeScript analytics against the benchmark
 * results already approved in docs/eda_findings.md, sql/README.md, and
 * the Stage 5 Streamlit dashboard. Nothing here is hardcoded into the
 * analytics functions themselves -- these are test targets only, checked
 * against values computed live from data/processed/web_export.json.
 *
 * loadDataset() is synchronous (reads the artifact from disk once), so
 * this is called directly at module scope rather than in beforeAll --
 * describe() bodies run during test collection, before any beforeAll
 * hook has fired, so values needed inside describe() itself must already
 * be available by then.
 */
const dataset = loadDataset();

describe("dataset integrity", () => {
  it("preserves all rows, including exact-duplicate-looking ones", () => {
    // 238,932 total rows is the approved row count from the cleaning
    // stage; the export/loader must not silently drop or dedupe rows.
    expect(dataset.rows.length).toBe(238_932);
  });
});

describe("complete-year detection", () => {
  it("identifies 2026-08 as the latest month", () => {
    const meta = getYearMetadata(dataset.rows);
    expect(meta.latestMonth).toEqual({ year: 2026, month: 8 });
  });

  it("identifies 2017 through 2025 as complete years", () => {
    const meta = getYearMetadata(dataset.rows);
    expect(meta.completeYears).toEqual([2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]);
  });

  it("does not treat 2026 as a complete year", () => {
    const meta = getYearMetadata(dataset.rows);
    expect(meta.completeYears).not.toContain(2026);
  });

  it("sets latestCompleteYear to 2025", () => {
    const meta = getYearMetadata(dataset.rows);
    expect(meta.latestCompleteYear).toBe(2025);
  });
});

describe("buildAnalyticsResponse row count (used by the new narrative sections)", () => {
  it("exposes the full dataset row count on the unfiltered response", () => {
    const response = buildAnalyticsResponse(dataset, {
      towns: dataset.towns,
      flatTypes: dataset.flatTypes,
      includePartial: false,
    });
    expect(response.rowCount).toBe(238_932);
  });
});

describe("default unfiltered KPI snapshot (latest complete year)", () => {
  const meta = getYearMetadata(dataset.rows);
  const filters = { towns: dataset.towns, flatTypes: dataset.flatTypes, includePartial: false };
  const { trendBase } = applyFilters(dataset.rows, filters, meta.completeYears);
  const kpi = computeKpiSnapshot(trendBase, meta.latestCompleteYear);

  it("median resale price is 628000", () => {
    expect(kpi.medianPrice).toBe(628_000);
  });

  it("median price per sqm is 6500", () => {
    expect(kpi.medianPpsm).toBe(6_500);
  });

  it("transaction count is 25085", () => {
    expect(kpi.transactions).toBe(25_085);
  });

  it("million-dollar share is approximately 6.35%", () => {
    expect(kpi.millionDollarSharePct).not.toBeNull();
    expect(kpi.millionDollarSharePct as number).toBeCloseTo(6.35, 1);
  });
});

describe("2017 -> 2025 growth caption", () => {
  const meta = getYearMetadata(dataset.rows);
  const filters = { towns: dataset.towns, flatTypes: dataset.flatTypes, includePartial: false };
  const { trendBase } = applyFilters(dataset.rows, filters, meta.completeYears);
  const growth = computeGrowthCaption(trendBase, meta.latestCompleteYear);

  it("median-price growth is approximately +53.17%", () => {
    expect(growth.priceGrowthPct).not.toBeNull();
    expect(growth.priceGrowthPct as number).toBeCloseTo(53.17, 1);
  });

  it("median price/sqm growth is approximately +51.80%", () => {
    expect(growth.ppsmGrowthPct).not.toBeNull();
    expect(growth.ppsmGrowthPct as number).toBeCloseTo(51.8, 1);
  });
});

describe("4 ROOM flat type, 2017 vs 2025", () => {
  const meta = getYearMetadata(dataset.rows);
  const filters = { towns: dataset.towns, flatTypes: ["4 ROOM"], includePartial: false };
  const { trendBase } = applyFilters(dataset.rows, filters, meta.completeYears);
  const trend = computeYearlyTrend(
    trendBase.filter((r) => meta.completeYears.includes(r.year)),
    meta.completeYears,
  );

  it("median price is 408000 in 2017", () => {
    const point2017 = trend.find((p) => p.year === 2017);
    expect(point2017?.medianPrice).toBe(408_000);
  });

  it("median price is 630000 in 2025", () => {
    const point2025 = trend.find((p) => p.year === 2025);
    expect(point2025?.medianPrice).toBe(630_000);
  });
});

describe("town appreciation, 2017 vs 2025", () => {
  const meta = getYearMetadata(dataset.rows);
  const filters = { towns: dataset.towns, flatTypes: dataset.flatTypes, includePartial: false };
  const { trendBase } = applyFilters(dataset.rows, filters, meta.completeYears);
  const result = computeTownAppreciation(trendBase, meta.latestCompleteYear);
  const highest = result.qualified[result.qualified.length - 1];
  const lowest = result.qualified[0];

  it("qualifies all 26 towns at the 30-transaction threshold", () => {
    expect(result.qualifiedCount).toBe(26);
  });

  it("ranks Toa Payoh highest at approximately +76.40%", () => {
    expect(highest?.town).toBe("TOA PAYOH");
    expect(highest?.growthPct).toBeCloseTo(76.4, 1);
  });

  it("ranks Marine Parade lowest at approximately +15.09%", () => {
    expect(lowest?.town).toBe("MARINE PARADE");
    expect(lowest?.growthPct).toBeCloseTo(15.09, 1);
  });
});

describe("million-dollar transaction share", () => {
  const meta = getYearMetadata(dataset.rows);
  const filters = { towns: dataset.towns, flatTypes: dataset.flatTypes, includePartial: false };
  const { trendBase } = applyFilters(dataset.rows, filters, meta.completeYears);
  const byYear = computeMillionDollarByYear(trendBase, meta.completeYears);

  it("2017 share is approximately 0.22%", () => {
    const y2017 = byYear.find((y) => y.year === 2017);
    expect(y2017?.sharePct).toBeCloseTo(0.22, 1);
  });

  it("2025 share is approximately 6.35%", () => {
    const y2025 = byYear.find((y) => y.year === 2025);
    expect(y2025?.sharePct).toBeCloseTo(6.35, 1);
  });
});

describe("partial-year toggle", () => {
  const meta = getYearMetadata(dataset.rows);

  it("includes latest-month rows in analysisRows when partial-year mode is ON", () => {
    const filters = { towns: dataset.towns, flatTypes: dataset.flatTypes, includePartial: true };
    const { analysisRows } = applyFilters(dataset.rows, filters, meta.completeYears);
    const latestMonthRows = analysisRows.filter((r) => r.isLatestMonth);
    expect(latestMonthRows.length).toBeGreaterThan(0);
    expect(latestMonthRows.length).toBe(1_984);
  });

  it("excludes latest-month rows from analysisRows when partial-year mode is OFF", () => {
    const filters = { towns: dataset.towns, flatTypes: dataset.flatTypes, includePartial: false };
    const { analysisRows } = applyFilters(dataset.rows, filters, meta.completeYears);
    expect(analysisRows.some((r) => r.isLatestMonth)).toBe(false);
  });

  it("keeps the KPI year at 2025 regardless of the partial-year toggle", () => {
    for (const includePartial of [true, false]) {
      const filters = { towns: dataset.towns, flatTypes: dataset.flatTypes, includePartial };
      const { trendBase } = applyFilters(dataset.rows, filters, meta.completeYears);
      const kpi = computeKpiSnapshot(trendBase, meta.latestCompleteYear);
      expect(kpi.year).toBe(2025);
      expect(kpi.medianPrice).toBe(628_000);
    }
  });

  it("never marks 2026 as a complete year in the trend chart, even when included", () => {
    const filters = { towns: dataset.towns, flatTypes: dataset.flatTypes, includePartial: true };
    const { analysisRows } = applyFilters(dataset.rows, filters, meta.completeYears);
    const trend = computeYearlyTrend(analysisRows, meta.completeYears);
    const point2026 = trend.find((p) => p.year === 2026);
    expect(point2026?.isCompleteYear).toBe(false);
  });
});

describe("empty and small-sample filter states", () => {
  const meta = getYearMetadata(dataset.rows);

  it("returns an empty base when no towns are selected", () => {
    const filters = { towns: [], flatTypes: dataset.flatTypes, includePartial: false };
    const { base } = applyFilters(dataset.rows, filters, meta.completeYears);
    expect(base.length).toBe(0);
  });

  it("returns an empty base when no flat types are selected", () => {
    const filters = { towns: dataset.towns, flatTypes: [], includePartial: false };
    const { base } = applyFilters(dataset.rows, filters, meta.completeYears);
    expect(base.length).toBe(0);
  });

  it("handles a single town without crashing", () => {
    const filters = { towns: ["BUKIT TIMAH"], flatTypes: dataset.flatTypes, includePartial: false };
    const { trendBase, analysisRows } = applyFilters(dataset.rows, filters, meta.completeYears);
    expect(analysisRows.every((r) => r.town === "BUKIT TIMAH")).toBe(true);
    const kpi = computeKpiSnapshot(trendBase, meta.latestCompleteYear);
    expect(kpi.transactions).toBeGreaterThan(0);
  });

  it("handles a single rare flat type without crashing", () => {
    const filters = { towns: dataset.towns, flatTypes: ["1 ROOM"], includePartial: false };
    const { analysisRows } = applyFilters(dataset.rows, filters, meta.completeYears);
    expect(analysisRows.every((r) => r.flatType === "1 ROOM")).toBe(true);
  });

  it("excludes thin town-year groups from the appreciation ranking", () => {
    // 1 ROOM flats total only 88 rows dataset-wide, far below the
    // 30-transactions-in-both-years threshold for most/all towns.
    const filters = { towns: dataset.towns, flatTypes: ["1 ROOM"], includePartial: false };
    const { trendBase } = applyFilters(dataset.rows, filters, meta.completeYears);
    const result = computeTownAppreciation(trendBase, meta.latestCompleteYear);
    expect(result.qualifiedCount).toBe(0);
  });
});

describe("lease chart flat-type selection (never introduces an excluded type)", () => {
  it("shows exactly the selection when 1-3 types are chosen", () => {
    const selection = resolveLeaseFlatTypes(["1 ROOM", "EXECUTIVE"]);
    expect(selection.types).toEqual(["1 ROOM", "EXECUTIVE"]);
    expect(selection.groupByType).toBe(true);
  });

  it("uses all three focus types when >3 selected and all three are present", () => {
    const selection = resolveLeaseFlatTypes(["1 ROOM", "2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM"]);
    expect(selection.types.sort()).toEqual(["3 ROOM", "4 ROOM", "5 ROOM"]);
  });

  it("uses only the focus types actually present when >3 selected and some are missing", () => {
    const selection = resolveLeaseFlatTypes(["3 ROOM", "4 ROOM", "1 ROOM", "EXECUTIVE"]);
    expect(selection.types).toEqual(["3 ROOM", "4 ROOM"]);
    for (const t of selection.types) {
      expect(["3 ROOM", "4 ROOM", "1 ROOM", "EXECUTIVE"]).toContain(t);
    }
  });

  it("aggregates across the selection when >3 selected and none are focus types", () => {
    const selected = ["1 ROOM", "2 ROOM", "EXECUTIVE", "MULTI-GENERATION"];
    const selection = resolveLeaseFlatTypes(selected);
    expect(selection.groupByType).toBe(false);
    expect(selection.types).toEqual(selected);
  });

  it("never returns a type outside the original selection", () => {
    const selected = ["3 ROOM", "1 ROOM", "EXECUTIVE", "2 ROOM"];
    const selection = resolveLeaseFlatTypes(selected);
    for (const t of selection.types) {
      expect(selected).toContain(t);
    }
  });
});
