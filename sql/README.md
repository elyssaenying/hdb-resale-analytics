# SQL Analysis

This stage reproduces the key findings from the Python EDA
(`docs/eda_findings.md`) using SQL against a local DuckDB database, as a
second, independent demonstration of the same conclusions.

## Why DuckDB

- Runs embedded, locally, with no database server to install or manage.
- Built for analytical (OLAP) SQL: window functions, `MEDIAN()`, and
  `FILTER`-based conditional aggregation all work out of the box.
- The SQL written here is standard enough to be broadly transferable to
  Postgres, Snowflake, BigQuery, etc., with only minor syntax changes
  (e.g. `MEDIAN()` and `FILTER` are not universal, but the concepts are).

## How the database is generated

```bash
source venv/bin/activate
python scripts/build_database.py
```

This reads `data/processed/hdb_resale_clean.csv` (untouched) and
(re)creates `data/processed/hdb_resale.duckdb` — a single table,
`hdb_resale`, with all 22 cleaned columns preserved, plus two small views:

- `complete_years` — years with all 12 calendar months present, after
  excluding the in-progress latest month (`is_latest_month = TRUE`).
- `latest_complete_year` — `MAX(year)` among `complete_years`.

These two views define the "complete year" logic **once**, in the
database, rather than repeating the same `HAVING COUNT(DISTINCT
month_number) = 12` logic in every query file. No year is hardcoded —
re-running the build script against a future data pull will recompute
both views from whatever data is present at the time.

The database file is gitignored (see root `.gitignore`,
`data/processed/*`) and is never committed.

## How to run the SQL analysis

```bash
source venv/bin/activate
python scripts/build_database.py      # build/refresh the database
python scripts/run_sql_analysis.py    # run all queries, print results
```

`run_sql_analysis.py` reads every `.sql` file in `sql/queries/` in
filename order, splits each file into its individual statements (each
preceded by a `-- @title: ...` comment used as a heading), executes them,
and prints the results. The `.sql` files are the source of truth — the
runner does not contain any duplicated analytical SQL of its own.

## What each query demonstrates

| File | Question answered | SQL techniques |
|---|---|---|
| `01_market_trend.sql` | How has the market changed since 2017, year by year? | CTE, `GROUP BY`, `MEDIAN`, `LAG()` window function, `CASE` |
| `02_town_comparison.sql` | Which towns have higher/lower price per sqm? | CTE, `GROUP BY`, `MEDIAN`, `RANK()` window function |
| `03_flat_type_analysis.sql` | How do flat types differ, and how have 3/4/5-room prices moved since 2017? | `GROUP BY`, `MEDIAN`, `FILTER` (conditional aggregation) |
| `04_town_appreciation.sql` | Which towns appreciated most/least, 2017 vs latest complete year? | CTE, `FILTER`, `RANK()` window function |
| `05_lease_and_storey.sql` | How do price/sqm relate to remaining lease and storey band? | CTE, `CASE` (banding), `GROUP BY`, `MEDIAN` |
| `06_million_dollar.sql` | How prevalent are $1M+ transactions, and where? | `FILTER`, `GROUP BY` |

Across the six files, every technique from the brief is used at least
once: **CTEs, `GROUP BY`, `CASE`, `MEDIAN`, conditional aggregation
(`FILTER`), window functions, `LAG`, and ranking (`RANK`)**.

## Methodology notes carried over from the Python EDA

- The latest, still-in-progress month (`is_latest_month = TRUE`) is
  excluded from every year-based comparison — never deleted from the
  table, only filtered out of these specific queries.
- A year only receives a normal year-over-year comparison if it is a
  **complete** year. The current partial year still appears in output
  where useful, clearly marked, with YoY fields as `NULL`/omitted rather
  than a misleading partial-vs-full percentage.
- Town appreciation (`04_town_appreciation.sql`) requires at least 30
  transactions in **both** comparison years before a town is ranked —
  the same threshold used in the Python EDA, for the same reason (guard
  against unstable medians from thin samples).
- The lease-band and storey-band relationships (`05_lease_and_storey.sql`)
  are reported as **correlational summaries only**. No regression or
  multivariable model is built at this stage, and the query file's header
  comment says so explicitly.
- Town/model rankings are not labeled "best value" — only "higher" or
  "lower" price per sqm, since price per sqm alone doesn't capture floor
  area, location preference, or amenities.

## Cross-validation against the Python EDA

Every headline SQL result was checked against the corresponding Python
EDA figure in `docs/eda_findings.md` and matched (to rounding):
2017/2025 median price and price/sqm, the 2017→2025 growth percentages
(market-wide and 4 ROOM), the town-appreciation ranking (Toa Payoh
highest, Marine Parade lowest), and the million-dollar transaction share
for 2017 and 2025. No methodological discrepancy was found between the
two approaches.
