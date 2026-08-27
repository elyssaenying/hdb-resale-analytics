import type { FilterState, Row } from "./types";

export interface FilteredSets {
  /** Town + flat-type filters applied; nothing else. */
  base: Row[];
  /** base, minus the in-progress latest month. Feeds the KPI snapshot,
   * the 2017 -> latest-complete-year growth caption, town appreciation,
   * and the million-dollar historical chart -- none of which are ever
   * affected by the partial-year toggle. */
  trendBase: Row[];
  /** Feeds the trend/town/flat-type/lease/storey charts. When the
   * partial-year toggle is on, includes the latest (possibly partial)
   * month's rows too; those rows are never treated as a complete year,
   * only shown as additional partial/YTD data points. */
  analysisRows: Row[];
}

/**
 * Ported exactly from app.py:
 *
 *   base = df[town.isin(selected_towns) & flat_type.isin(selected_flat_types)]
 *   trend_base = base[~base["is_latest_month"]]
 *   if include_partial:
 *       analysis_df = base
 *   else:
 *       analysis_df = trend_base[trend_base["year"].isin(complete_years)]
 */
export function applyFilters(
  allRows: Row[],
  filters: FilterState,
  completeYears: number[],
): FilteredSets {
  const townSet = new Set(filters.towns);
  const flatTypeSet = new Set(filters.flatTypes);
  const completeYearSet = new Set(completeYears);

  const base = allRows.filter(
    (r) => townSet.has(r.town) && flatTypeSet.has(r.flatType),
  );
  const trendBase = base.filter((r) => !r.isLatestMonth);
  const analysisRows = filters.includePartial
    ? base
    : trendBase.filter((r) => completeYearSet.has(r.year));

  return { base, trendBase, analysisRows };
}
