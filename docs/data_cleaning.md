# Data Cleaning Notes

This document explains how `data/raw/resale_flat_prices_2017_onwards.csv` is
transformed into `data/processed/hdb_resale_clean.csv` by
[`scripts/clean_data.py`](../scripts/clean_data.py), and why.

The raw file is never modified. All original columns are preserved
unchanged in the processed file; cleaning only **adds** new derived
columns alongside them.

## Source

- data.gov.sg dataset `d_8b84c4ee58e3cfc0ece0d773c8ca6abc`
  ("Resale flat prices based on registration date from Jan-2017 onwards")
- Downloaded via `scripts/acquire_data.py`
- The source is a live, rolling dataset — re-running the acquisition
  script later will pull additional rows (see "Latest-month limitation"
  below).

## Transformations

| New column | Derived from | Logic |
|---|---|---|
| `month_date` | `month` | Parsed `"YYYY-MM"` into a real date, set to the 1st of that month |
| `year` | `month_date` | Calendar year |
| `month_number` | `month_date` | Calendar month (1–12) |
| `remaining_lease_months` | `remaining_lease` | Parsed text (e.g. `"61 years 04 months"`) into total months |
| `remaining_lease_years` | `remaining_lease_months` | `months / 12`, rounded to 2 decimals |
| `storey_low`, `storey_high` | `storey_range` | Parsed `"10 TO 12"` into low/high integers |
| `storey_mid` | `storey_low`, `storey_high` | Midpoint of the storey band |
| `price_per_sqm` | `resale_price`, `floor_area_sqm` | Simple division |
| `is_exact_duplicate` | all 11 raw columns | `True` if the row's raw values exactly match another row's |
| `is_latest_month` | `month_date` | `True` if the row belongs to the most recent month in the dataset |

`floor_area_sqm` and `resale_price` are also explicitly coerced to numeric
types (`pd.to_numeric`), with any coercion failures reported rather than
silently dropped. In this run, both were already fully numeric — 0 values
failed coercion.

### Why `month` becomes a new column instead of being overwritten

The task required preserving all raw columns exactly as delivered while
also producing a proper datetime. Rather than overwrite `month` (which
would technically violate "preserve raw columns"), the original `month`
string is kept untouched and a new `month_date` column carries the parsed
datetime. Downstream analysis should use `month_date`.

### `remaining_lease` parsing

The raw column uses free text such as `"61 years 04 months"`, `"63 years"`,
and `"62 years 01 month"` (singular "month" appears; singular "year" does
not occur in this dataset but the parser handles it too, since the source
is live and could include it in a future pull). A regex extracts the
years and optional months and converts to total months. **Every row in
this run parsed successfully — 0 failures.** If a future pull contains an
unparseable value, the script reports it explicitly (row count + sample)
rather than defaulting it to 0, since a silent 0 would be indistinguishable
from a flat with an expired lease.

### `storey_range` parsing

Format is consistently `"NN TO NN"` in this dataset. All 238,932 rows
parsed successfully — 0 failures.

## Duplicate policy

**633 rows** (316 distinct groups — 315 groups of 2 rows, 1 group of 3)
are exact duplicates across all 11 raw columns (same month, town, flat
type, block, street, storey range, floor area, flat model, lease
commence date, remaining lease, and price).

**These rows are NOT removed.** The dataset has no transaction ID, so two
identical rows could be:

- a genuine data export duplicate, or
- two separate, coincidentally identical transactions (e.g. two similar
  units in the same block sold in the same month at the same price —
  plausible given HDB's price-banding by block/storey).

Because we cannot distinguish these cases without a transaction ID, we
flag them (`is_exact_duplicate = True`) and leave the decision of
whether to deduplicate to the specific analysis being performed,
documented at the point of use.

## Latest-month limitation

The dataset is live/rolling. As of this cleaning run, the maximum month
is **2026-08**, which is the current calendar month at the time of
writing — i.e. **incomplete**, since the month has not yet finished. Rows
belonging to this month are flagged with `is_latest_month = True` rather
than removed.

**Any analysis comparing monthly transaction volumes or aggregates must
either exclude `is_latest_month = True` rows or explicitly note that the
latest month is partial**, otherwise it will understate that month's
activity relative to complete months. This will be handled at the
analysis/dashboard stage.

## Data quality observations

- **No missing values** in any of the 11 raw columns, and none were
  introduced by cleaning.
- **No category spelling/casing inconsistencies** were found in `town`,
  `flat_type`, `flat_model`, or `storey_range` (checked via
  case-insensitive collision detection) — no standardization was
  necessary.
- **`floor_area_sqm` max is 366.7 sqm**, for a "3 ROOM" flat with
  `flat_model = "Terrace"` in Kallang/Whampoa (Jln Ma'mor / Jln Bahagia).
  Several other rows on the same streets show similarly large (200–250
  sqm) 3-room Terrace flats. "Terrace" is a genuinely rare HDB flat
  model (122 rows total in the whole dataset) consisting of landed-style
  units, so this outlier is treated as **plausible**, not an error, and
  was not removed or capped.
- **`lease_commence_date` reaches 2023**, and ~14,451 rows (~6% of the
  dataset) show a resale transaction occurring fewer than 5 calendar
  years after the recorded `lease_commence_date`. This pattern is
  systematic across many years, not a one-off glitch. Neither the
  data.gov.sg data dictionary for this dataset nor an official HDB
  source consulted while writing this document defines what specific
  event `lease_commence_date` marks, so no claim is made about that
  here. Some transactions occur fewer than five calendar years after
  the recorded `lease_commence_date`. This field should therefore not
  be treated as a proxy for Minimum Occupation Period eligibility. No
  rows are modified based on this observation.
- **Resale price range:** \$140,000–\$1,728,000. Both extremes recur
  across multiple towns/years at similar levels (not isolated single
  rows), consistent with known real-world reporting of record HDB
  resale prices in mature/central estates, so both ends are treated as
  plausible.
- No rows failed the validity checks: `floor_area_sqm > 0`,
  `resale_price > 0`, `remaining_lease_months > 0`,
  `lease_commence_date` within `[1960, current_year]`, or
  `storey_low <= storey_high`.

## Assumptions made

1. `month` values are always in `"YYYY-MM"` format (confirmed for all
   238,932 rows in this pull).
2. `remaining_lease` always follows `"N years[, M months]"` phrasing
   (confirmed for all rows in this pull; parser reports, rather than
   assumes, if this changes in a future pull).
3. Exact-duplicate rows are treated as ambiguous, not erroneous, due to
   the absence of a transaction ID (see "Duplicate policy" above).
4. No outliers were removed. Extreme but internally-consistent values
   (very large floor areas, very high/low prices, short
   lease-commence-to-sale gaps) are reported and reasoned about above,
   but left in the dataset — outlier handling, if any, is deferred to
   the analysis stage where it can be justified per-question.
