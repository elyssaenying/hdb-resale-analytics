# Singapore HDB Resale Market Analytics

## Objective

Analyze Singapore's public housing (HDB) resale market to answer:

> How has Singapore's HDB resale market changed since 2017, which towns and
> flat types provide the best value, and what factors are associated with
> resale prices?

This is a personal portfolio project demonstrating data acquisition,
cleaning, SQL-based analysis, and interactive dashboarding for Data
Analyst / Business Analyst roles.

## Data Source

- **Provider:** [data.gov.sg](https://data.gov.sg)
- **Dataset:** Resale flat prices based on registration date from Jan-2017 onwards
- **Dataset ID:** `d_8b84c4ee58e3cfc0ece0d773c8ca6abc`
- **Access method:** [data.gov.sg Dataset Download API](https://guide.data.gov.sg/developer-guide/dataset-apis/download-dataset)
- **License:** Singapore Open Data Licence

Raw data is downloaded as-is and kept untouched under `data/raw/`.

## Technologies

- Python (pandas)
- SQL (DuckDB) — structured analysis
- Plotly — interactive visualizations (Streamlit dashboard)
- Streamlit — interactive dashboard, with town / flat-type filters
- Next.js (App Router) + TypeScript + Tailwind CSS — analytical case
  study website
- Recharts + Motion — charting and restrained motion, in the website
- Vitest — analytics unit/benchmark tests, in the website

## Planned Analytical Questions

1. How have resale prices trended since 2017, overall and by town?
2. Which towns and flat types offer the best value (price per sqm)?
3. How does remaining lease relate to resale price?
4. Are there seasonal or cyclical patterns in resale transactions?
5. Which factors (floor area, storey range, flat model, lease, town) show
   the strongest association with resale price?

## Project Status

**Completed:** official API acquisition, cleaning / feature engineering,
exploratory data analysis (Python/pandas), SQL analysis (DuckDB), an
interactive Streamlit dashboard (Plotly visualizations, town / flat-type
filters), and a Next.js analytical case study website (same filters and
findings, ported and unit-tested against the approved benchmarks) — see
`docs/`, `sql/`, and `DESIGN.md` for full write-ups.

**Upcoming:** public deployment. Neither the Streamlit dashboard nor the
Next.js website is deployed yet — both are currently local-only. The
website's data-hosting approach for deployment (currently a local
generated JSON artifact) is a separate decision to be made in the
deployment stage.

## Project Structure

```
hdb-resale-analytics/
├── app.py             # Streamlit dashboard entrypoint
├── app/                # Next.js App Router (website)
│   ├── page.tsx        # server-rendered default view
│   ├── layout.tsx
│   └── api/analytics/  # route handler: filters -> aggregated JSON
├── components/
│   ├── dashboard/       # masthead, filter bar, snapshot, methodology, shell
│   ├── charts/           # one component per chart, Recharts-based
│   └── ui/                # small custom primitives (multiselect, toggle)
├── lib/
│   ├── analytics/         # ported analytics logic (mirrors app.py exactly)
│   ├── data/loader.ts       # reads the generated web JSON artifact
│   ├── charts/theme.ts        # shared chart styling tokens
│   ├── config.ts
│   └── formatting.ts
├── tests/                # Vitest: benchmark + unit tests for lib/analytics
├── DESIGN.md            # research + chosen art direction for the website
├── data/
│   ├── raw/          # untouched source data from data.gov.sg (gitignored)
│   └── processed/    # cleaned CSV, DuckDB database, web JSON artifact (gitignored)
├── docs/
│   ├── data_cleaning.md
│   └── eda_findings.md
├── sql/
│   ├── README.md
│   └── queries/       # 01_market_trend.sql ... 06_million_dollar.sql
├── scripts/
│   ├── acquire_data.py
│   ├── clean_data.py
│   ├── eda.py
│   ├── build_database.py
│   ├── run_sql_analysis.py
│   └── export_dashboard_data.py   # generates the website's data artifact
├── requirements.txt
├── package.json
└── README.md
```

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Running the Data Acquisition Script

```bash
source venv/bin/activate
python scripts/acquire_data.py
```

This downloads the latest dataset snapshot to `data/raw/` and prints a
basic validation report (row count, columns, date range, missing values,
duplicates).

## Running the Dashboard

```bash
source venv/bin/activate
streamlit run app.py
```

This is currently local-only (not yet deployed publicly). It reads
`data/processed/hdb_resale_clean.csv` directly with pandas.

## Website (Next.js analytical case study)

The website presents the same findings and filters as the Streamlit
dashboard, as a polished single-page case study intended for eventual
public deployment. It ports the dashboard's analytics logic into
TypeScript (see `lib/analytics/`) rather than reimplementing it from
scratch — `app.py` remains the source of truth it was ported from, and
both are unit-tested against the same approved benchmark numbers.

It does **not** read the 38 MB processed CSV directly, and does not use
the DuckDB database (that already independently demonstrates SQL skills
on its own). Instead, a Python export script produces a compact,
row-level JSON artifact containing only the columns the website actually
uses; a server-side loader reads that artifact once, and every filter
change is aggregated server-side (`/api/analytics`), so the browser only
ever receives small, pre-aggregated JSON responses — never raw rows. See
`DESIGN.md` for the full data-architecture rationale.

**1. Generate the website's data artifact** (run this after any change to
`data/processed/hdb_resale_clean.csv`):

```bash
source venv/bin/activate
python scripts/export_dashboard_data.py
```

This writes `data/processed/web_export.json` (gitignored, regenerated on
demand — never committed, same convention as the DuckDB database).

**2. Install frontend dependencies:**

```bash
npm install
```

**3. Run the website locally:**

```bash
npm run dev
```

Then open http://localhost:3000.

**4. Run validation:**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` runs the Vitest suite in `tests/`, which validates the ported
analytics against the same benchmark numbers documented in
`docs/eda_findings.md` and `sql/README.md` (e.g. 2025 median price
$628,000, 2017→2025 growth ≈+53.17%, Toa Payoh appreciation ≈+76.40%).

Public deployment (Vercel) is **not** set up yet — this is a separate,
later stage, including a decision on how the data artifact is hosted in
production.
