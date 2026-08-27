import { getYearMetadata, type YearMetadata } from "./complete-years";
import { applyFilters } from "./filters";
import {
  computeFlatTypeStats,
  computeGrowthCaption,
  computeKpiSnapshot,
  computeLeaseBandStats,
  computeMillionDollarByYear,
  computeStoreyStats,
  computeTownAppreciation,
  computeTownStats,
  computeYearlyTrend,
  resolveLeaseFlatTypes,
  type AppreciationResult,
  type FlatTypeStat,
  type GrowthCaption,
  type KpiSnapshot,
  type LeaseBandRow,
  type LeaseFlatTypeSelection,
  type MillionDollarYear,
  type StoreyBandRow,
  type TownStat,
  type YearlyTrendPoint,
} from "./metrics";
import type { Dataset, FilterState } from "./types";

export type AnalyticsResponse =
  | {
      towns: string[];
      flatTypes: string[];
      yearMeta: YearMetadata;
      /** Total rows in the underlying dataset, independent of any filter
       * -- used for narrative copy (e.g. "238,932 transactions"), not a
       * new analytical computation, just an existing count exposed. */
      rowCount: number;
      empty: true;
      reason: "no-towns" | "no-flat-types" | "no-rows";
    }
  | {
      towns: string[];
      flatTypes: string[];
      yearMeta: YearMetadata;
      rowCount: number;
      empty: false;
      kpi: KpiSnapshot;
      trend: YearlyTrendPoint[];
      growth: GrowthCaption;
      townStats: TownStat[];
      flatTypeStats: FlatTypeStat[];
      appreciation: AppreciationResult;
      leaseBands: { selection: LeaseFlatTypeSelection; rows: LeaseBandRow[] };
      storeyStats: StoreyBandRow[];
      millionDollarByYear: MillionDollarYear[];
    };

/**
 * The single place that assembles a full analytics payload for a given
 * filter state. Used by both the /api/analytics route handler (for
 * client-side filter changes) and the server-rendered initial page (for
 * the default, unfiltered view) -- so the two never define this
 * composition twice.
 */
export function buildAnalyticsResponse(dataset: Dataset, filters: FilterState): AnalyticsResponse {
  const yearMeta = getYearMetadata(dataset.rows);
  const rowCount = dataset.rows.length;

  if (filters.towns.length === 0) {
    return { towns: dataset.towns, flatTypes: dataset.flatTypes, yearMeta, rowCount, empty: true, reason: "no-towns" };
  }
  if (filters.flatTypes.length === 0) {
    return { towns: dataset.towns, flatTypes: dataset.flatTypes, yearMeta, rowCount, empty: true, reason: "no-flat-types" };
  }

  const { trendBase, analysisRows } = applyFilters(dataset.rows, filters, yearMeta.completeYears);

  if (analysisRows.length === 0) {
    return { towns: dataset.towns, flatTypes: dataset.flatTypes, yearMeta, rowCount, empty: true, reason: "no-rows" };
  }

  const leaseSelection = resolveLeaseFlatTypes(filters.flatTypes);

  return {
    towns: dataset.towns,
    flatTypes: dataset.flatTypes,
    yearMeta,
    rowCount,
    empty: false,
    kpi: computeKpiSnapshot(trendBase, yearMeta.latestCompleteYear),
    trend: computeYearlyTrend(analysisRows, yearMeta.completeYears),
    growth: computeGrowthCaption(trendBase, yearMeta.latestCompleteYear),
    townStats: computeTownStats(analysisRows),
    flatTypeStats: computeFlatTypeStats(analysisRows),
    appreciation: computeTownAppreciation(trendBase, yearMeta.latestCompleteYear),
    leaseBands: { selection: leaseSelection, rows: computeLeaseBandStats(analysisRows, leaseSelection) },
    storeyStats: computeStoreyStats(analysisRows),
    millionDollarByYear: computeMillionDollarByYear(trendBase, yearMeta.completeYears),
  };
}
