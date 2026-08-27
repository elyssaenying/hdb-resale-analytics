import type { Row } from "./types";

export interface YearMetadata {
  latestMonth: { year: number; month: number };
  currentYear: number;
  completeYears: number[];
  latestCompleteYear: number;
}

/**
 * Complete-year detection: ported exactly from app.py's get_year_metadata.
 *
 *   trend = df[~df["is_latest_month"]]
 *   latest_month = df["month_date"].max()
 *   months_per_year = trend.groupby("year")["month_number"].nunique()
 *   complete_years = sorted(months_per_year[months_per_year == 12].index)
 *   latest_complete_year = max(complete_years)
 *
 * A year only counts as complete if all 12 calendar months are present
 * after excluding the in-progress latest month. Nothing here is
 * hardcoded to a specific year -- this must keep working on future data
 * pulls with a different latest month.
 */
export function getYearMetadata(rows: Row[]): YearMetadata {
  const latestMonthRow = rows.find((r) => r.isLatestMonth);

  let latestYear: number;
  let latestMonthNum: number;
  if (latestMonthRow) {
    latestYear = latestMonthRow.year;
    latestMonthNum = latestMonthRow.monthNumber;
  } else {
    // Fallback if no row is flagged is_latest_month (shouldn't happen with
    // data produced by clean_data.py, but avoid crashing on unusual input).
    let best = -Infinity;
    latestYear = 0;
    latestMonthNum = 0;
    for (const r of rows) {
      const key = r.year * 12 + r.monthNumber;
      if (key > best) {
        best = key;
        latestYear = r.year;
        latestMonthNum = r.monthNumber;
      }
    }
  }

  const monthsByYear = new Map<number, Set<number>>();
  for (const r of rows) {
    if (r.isLatestMonth) continue;
    let months = monthsByYear.get(r.year);
    if (!months) {
      months = new Set();
      monthsByYear.set(r.year, months);
    }
    months.add(r.monthNumber);
  }

  const completeYears: number[] = [];
  for (const [year, months] of monthsByYear) {
    if (months.size === 12) completeYears.push(year);
  }
  completeYears.sort((a, b) => a - b);

  const latestCompleteYear =
    completeYears.length > 0 ? Math.max(...completeYears) : NaN;

  return {
    latestMonth: { year: latestYear, month: latestMonthNum },
    currentYear: latestYear,
    completeYears,
    latestCompleteYear,
  };
}
