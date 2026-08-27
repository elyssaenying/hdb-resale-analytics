import { leaseBandFor, LEASE_BANDS, storeyBandFor, STOREY_BANDS } from "./bands";
import { groupBy, median, percentChange } from "./stats";
import type { Row } from "./types";
import { APPRECIATION_MIN_N, BASELINE_YEAR, FOCUS_FLAT_TYPES, MILLION_DOLLAR_THRESHOLD } from "@/lib/constants";

// ---------------------------------------------------------------------
// F. KPI snapshot -- always the latest COMPLETE year, from trendBase,
//    regardless of the partial-year toggle (app.py section F).
// ---------------------------------------------------------------------
export interface KpiSnapshot {
  year: number;
  medianPrice: number | null;
  medianPpsm: number | null;
  transactions: number;
  millionDollarSharePct: number | null;
}

export function computeKpiSnapshot(trendBaseRows: Row[], latestCompleteYear: number): KpiSnapshot {
  const subset = trendBaseRows.filter((r) => r.year === latestCompleteYear);
  if (subset.length === 0) {
    return { year: latestCompleteYear, medianPrice: null, medianPpsm: null, transactions: 0, millionDollarSharePct: null };
  }
  const millionCount = subset.filter((r) => r.resalePrice >= MILLION_DOLLAR_THRESHOLD).length;
  return {
    year: latestCompleteYear,
    medianPrice: median(subset.map((r) => r.resalePrice)),
    medianPpsm: median(subset.map((r) => r.pricePerSqm)),
    transactions: subset.length,
    millionDollarSharePct: (millionCount / subset.length) * 100,
  };
}

// ---------------------------------------------------------------------
// G. Market trend + growth caption (app.py section G)
// ---------------------------------------------------------------------
export interface YearlyTrendPoint {
  year: number;
  isCompleteYear: boolean;
  medianPrice: number | null;
  medianPpsm: number | null;
  transactions: number;
}

export function computeYearlyTrend(analysisRows: Row[], completeYears: number[]): YearlyTrendPoint[] {
  const completeYearSet = new Set(completeYears);
  const byYear = groupBy(analysisRows, (r) => r.year);
  const points: YearlyTrendPoint[] = [];
  for (const [year, rows] of byYear) {
    points.push({
      year,
      isCompleteYear: completeYearSet.has(year),
      medianPrice: median(rows.map((r) => r.resalePrice)),
      medianPpsm: median(rows.map((r) => r.pricePerSqm)),
      transactions: rows.length,
    });
  }
  points.sort((a, b) => a.year - b.year);
  return points;
}

export interface GrowthCaption {
  price2017: number | null;
  priceLatest: number | null;
  ppsm2017: number | null;
  ppsmLatest: number | null;
  priceGrowthPct: number | null;
  ppsmGrowthPct: number | null;
  hasData: boolean;
}

/** Always 2017 -> latest complete year, computed from trendBase --
 * regardless of the partial-year toggle (app.py: growth_base). */
export function computeGrowthCaption(trendBaseRows: Row[], latestCompleteYear: number): GrowthCaption {
  const growthBase = trendBaseRows.filter(
    (r) => r.year === BASELINE_YEAR || r.year === latestCompleteYear,
  );
  const rows2017 = growthBase.filter((r) => r.year === BASELINE_YEAR);
  const rowsLatest = growthBase.filter((r) => r.year === latestCompleteYear);

  const price2017 = median(rows2017.map((r) => r.resalePrice));
  const priceLatest = median(rowsLatest.map((r) => r.resalePrice));
  const ppsm2017 = median(rows2017.map((r) => r.pricePerSqm));
  const ppsmLatest = median(rowsLatest.map((r) => r.pricePerSqm));

  const hasData = price2017 !== null && priceLatest !== null && ppsm2017 !== null && ppsmLatest !== null;

  return {
    price2017,
    priceLatest,
    ppsm2017,
    ppsmLatest,
    priceGrowthPct: hasData ? percentChange(priceLatest, price2017) : null,
    ppsmGrowthPct: hasData ? percentChange(ppsmLatest, ppsm2017) : null,
    hasData,
  };
}

// ---------------------------------------------------------------------
// H. Town comparison (app.py section H)
// ---------------------------------------------------------------------
export interface TownStat {
  town: string;
  medianPrice: number | null;
  medianPpsm: number | null;
  transactions: number;
}

export function computeTownStats(analysisRows: Row[]): TownStat[] {
  const byTown = groupBy(analysisRows, (r) => r.town);
  const stats: TownStat[] = [];
  for (const [town, rows] of byTown) {
    stats.push({
      town,
      medianPrice: median(rows.map((r) => r.resalePrice)),
      medianPpsm: median(rows.map((r) => r.pricePerSqm)),
      transactions: rows.length,
    });
  }
  stats.sort((a, b) => (a.medianPpsm ?? 0) - (b.medianPpsm ?? 0));
  return stats;
}

// ---------------------------------------------------------------------
// I. Flat type comparison (app.py section I)
// ---------------------------------------------------------------------
export interface FlatTypeStat {
  flatType: string;
  medianPrice: number | null;
  medianPpsm: number | null;
  medianFloorArea: number | null;
  transactions: number;
}

export function computeFlatTypeStats(analysisRows: Row[]): FlatTypeStat[] {
  const byType = groupBy(analysisRows, (r) => r.flatType);
  const stats: FlatTypeStat[] = [];
  for (const [flatType, rows] of byType) {
    stats.push({
      flatType,
      medianPrice: median(rows.map((r) => r.resalePrice)),
      medianPpsm: median(rows.map((r) => r.pricePerSqm)),
      medianFloorArea: median(rows.map((r) => r.floorAreaSqm)),
      transactions: rows.length,
    });
  }
  stats.sort((a, b) => (a.medianPrice ?? 0) - (b.medianPrice ?? 0));
  return stats;
}

// ---------------------------------------------------------------------
// J. Town appreciation: 2017 vs latest complete year (app.py section J)
// ---------------------------------------------------------------------
export interface TownAppreciation {
  town: string;
  price2017: number;
  priceLatest: number;
  growthPct: number;
  txn2017: number;
  txnLatest: number;
}

export interface AppreciationResult {
  qualified: TownAppreciation[];
  qualifiedCount: number;
  totalTownCount: number;
  insufficientData: boolean;
}

export function computeTownAppreciation(
  trendBaseRows: Row[],
  latestCompleteYear: number,
): AppreciationResult {
  const apprBase = trendBaseRows.filter(
    (r) => r.year === BASELINE_YEAR || r.year === latestCompleteYear,
  );
  const byTown = groupBy(apprBase, (r) => r.town);

  const candidates: TownAppreciation[] = [];
  for (const [town, rows] of byTown) {
    const rows2017 = rows.filter((r) => r.year === BASELINE_YEAR);
    const rowsLatest = rows.filter((r) => r.year === latestCompleteYear);
    if (rows2017.length === 0 || rowsLatest.length === 0) continue;

    const price2017 = median(rows2017.map((r) => r.resalePrice));
    const priceLatest = median(rowsLatest.map((r) => r.resalePrice));
    if (price2017 === null || priceLatest === null) continue;

    candidates.push({
      town,
      price2017,
      priceLatest,
      growthPct: percentChange(priceLatest, price2017) ?? 0,
      txn2017: rows2017.length,
      txnLatest: rowsLatest.length,
    });
  }

  const qualified = candidates
    .filter((c) => c.txn2017 >= APPRECIATION_MIN_N && c.txnLatest >= APPRECIATION_MIN_N)
    .sort((a, b) => a.growthPct - b.growthPct);

  return {
    qualified,
    qualifiedCount: qualified.length,
    totalTownCount: candidates.length,
    insufficientData: candidates.length === 0,
  };
}

// ---------------------------------------------------------------------
// K. Remaining lease -- flat-type selection behavior (app.py section K,
//    as corrected in the Stage 5.5 audit). Never introduces a flat type
//    the sidebar filter excluded.
// ---------------------------------------------------------------------
export interface LeaseFlatTypeSelection {
  types: string[];
  groupByType: boolean;
  note: string;
}

export function resolveLeaseFlatTypes(selectedFlatTypes: string[]): LeaseFlatTypeSelection {
  if (selectedFlatTypes.length <= 3) {
    return { types: selectedFlatTypes, groupByType: true, note: "" };
  }

  const focusInSelection = FOCUS_FLAT_TYPES.filter((ft) => selectedFlatTypes.includes(ft));

  if (focusInSelection.length === 3) {
    return {
      types: [...FOCUS_FLAT_TYPES],
      groupByType: true,
      note: "Showing 3 ROOM / 4 ROOM / 5 ROOM (of the selected flat types), for readability.",
    };
  }
  if (focusInSelection.length > 0) {
    return {
      types: focusInSelection,
      groupByType: true,
      note: `Showing ${focusInSelection.join(", ")} (of the selected flat types), for readability.`,
    };
  }
  return {
    types: selectedFlatTypes,
    groupByType: false,
    note: "Showing an aggregated view across all selected flat types, for readability.",
  };
}

export interface LeaseBandRow {
  leaseBand: string;
  flatType: string | null;
  medianPpsm: number | null;
  transactions: number;
}

export function computeLeaseBandStats(
  analysisRows: Row[],
  selection: LeaseFlatTypeSelection,
): LeaseBandRow[] {
  const typeSet = new Set(selection.types);
  const scoped = analysisRows.filter((r) => typeSet.has(r.flatType));

  const results: LeaseBandRow[] = [];

  if (selection.groupByType) {
    // Nested grouping, not a joined-then-split string key -- flat type
    // labels like "3 ROOM" contain spaces, so combining leaseBand and
    // flatType into one string and splitting on " " would silently
    // corrupt them.
    const byType = groupBy(scoped, (r) => r.flatType);
    for (const [flatType, typeRows] of byType) {
      const byBand = groupBy(typeRows, (r) => leaseBandFor(r.remainingLeaseYears));
      for (const [leaseBand, rows] of byBand) {
        results.push({
          leaseBand,
          flatType,
          medianPpsm: median(rows.map((r) => r.pricePerSqm)),
          transactions: rows.length,
        });
      }
    }
  } else {
    const byBand = groupBy(scoped, (r) => leaseBandFor(r.remainingLeaseYears));
    for (const [leaseBand, rows] of byBand) {
      results.push({
        leaseBand,
        flatType: null,
        medianPpsm: median(rows.map((r) => r.pricePerSqm)),
        transactions: rows.length,
      });
    }
  }

  const bandOrder = new Map(LEASE_BANDS.map((b, i) => [b, i]));
  results.sort((a, b) => (bandOrder.get(a.leaseBand as (typeof LEASE_BANDS)[number]) ?? 0) - (bandOrder.get(b.leaseBand as (typeof LEASE_BANDS)[number]) ?? 0));
  return results;
}

// ---------------------------------------------------------------------
// L. Storey association (app.py section L)
// ---------------------------------------------------------------------
export interface StoreyBandRow {
  storeyBand: string;
  medianPpsm: number | null;
  transactions: number;
}

export function computeStoreyStats(analysisRows: Row[]): StoreyBandRow[] {
  const byBand = groupBy(analysisRows, (r) => storeyBandFor(r.storeyMid));
  const results: StoreyBandRow[] = [];
  for (const [storeyBand, rows] of byBand) {
    results.push({
      storeyBand,
      medianPpsm: median(rows.map((r) => r.pricePerSqm)),
      transactions: rows.length,
    });
  }
  const bandOrder = new Map(STOREY_BANDS.map((b, i) => [b, i]));
  results.sort((a, b) => (bandOrder.get(a.storeyBand as (typeof STOREY_BANDS)[number]) ?? 0) - (bandOrder.get(b.storeyBand as (typeof STOREY_BANDS)[number]) ?? 0));
  return results;
}

// ---------------------------------------------------------------------
// M. Million-dollar transaction share, complete years only (app.py section M)
// ---------------------------------------------------------------------
export interface MillionDollarYear {
  year: number;
  transactions: number;
  millionDollar: number;
  sharePct: number;
}

export function computeMillionDollarByYear(
  trendBaseRows: Row[],
  completeYears: number[],
): MillionDollarYear[] {
  const completeYearSet = new Set(completeYears);
  const milBase = trendBaseRows.filter((r) => completeYearSet.has(r.year));
  const byYear = groupBy(milBase, (r) => r.year);

  const results: MillionDollarYear[] = [];
  for (const [year, rows] of byYear) {
    const millionDollar = rows.filter((r) => r.resalePrice >= MILLION_DOLLAR_THRESHOLD).length;
    results.push({
      year,
      transactions: rows.length,
      millionDollar,
      sharePct: (millionDollar / rows.length) * 100,
    });
  }
  results.sort((a, b) => a.year - b.year);
  return results;
}
