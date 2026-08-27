# Singapore HDB Resale Market Analytics

**Live website:** https://hdb-resale-analytics.vercel.app/

## Objective

Analyze Singapore's public housing (HDB) resale market to answer:

> How has Singapore's HDB resale market changed since 2017, which towns and
> flat types offer relatively more space per dollar, and what factors are
> associated with resale prices?

This is a personal portfolio project demonstrating data acquisition,
cleaning, SQL-based analysis, and interactive dashboarding for Data
Analyst / Business Analyst roles.

## Business Problem

How can a housing advisory, property marketplace, or market-intelligence
team help users understand changes in Singapore's HDB resale market,
compare price-and-space trade-offs across market segments, and identify
important market signals using reliable transaction evidence?

This is a **descriptive market-intelligence and decision-support tool** —
not an individual property valuation model, a price-forecasting system,
investment advice, a mortgage affordability calculator, or proof that any
town is objectively "best."

**Primary audience:** property advisory, housing marketplace, and
residential market-intelligence teams.

**Secondary audiences:** prospective HDB resale buyers doing preliminary
market research, property agents benchmarking market segments, and
housing/public-policy analysts monitoring broad resale-market signals.

The live website's "The Decision Problem," "What the Data Shows," "From
Analysis to Decision," and "Conclusion" sections develop this framing in
full, including specific stakeholder use cases and their limitations.

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
2. Which towns and flat types offer more floor area per dollar (price per sqm)?
3. How does remaining lease relate to resale price?
4. Are there seasonal or cyclical patterns in resale transactions?
5. Which factors (floor area, storey range, flat model, lease, town) show
   the strongest association with resale price?

## Project Status

**Completed and deployed.** Official API acquisition, cleaning / feature
engineering, exploratory data analysis (Python/pandas), SQL analysis
(DuckDB), an interactive Streamlit dashboard (Plotly visualizations, town
/ flat-type filters, local-only), and a Next.js analytical case study
website — same filters and findings as the dashboard, ported and
unit-tested against the approved benchmarks, extended with a business
case-study narrative (problem framing, executive insights, stakeholder
applications, conclusion, and analytical reflection) — **publicly
deployed on Vercel:** https://hdb-resale-analytics.vercel.app/

See `docs/`, `sql/`, and `DESIGN.md` for full write-ups. The Streamlit
dashboard is not publicly deployed; the Next.js website is the deployed,
public-facing product.

## Project Structure

```
hdb-resale-analytics/
├── app.py             # Streamlit dashboard entrypoint
├── app/                # Next.js App Router (website)
│   ├── page.tsx        # server-rendered default view
│   ├── layout.tsx
│   └── api/analytics/  # route handler: filters -> aggregated JSON
├── components/
│   ├── dashboard/       # masthead, business-context, filter bar, snapshot,
│   │                    # executive-insights, business-applications,
│   │                    # case-study-conclusion, methodology, shell
│   ├── charts/           # one component per chart, Recharts-based
│   └── ui/                # small custom primitives (multiselect, toggle)
├── lib/
│   ├── analytics/         # ported analytics logic (mirrors app.py exactly)
│   ├── data/loader.ts       # reads the generated web JSON artifact
│   ├── charts/theme.ts        # shared chart styling tokens
│   ├── config.ts                # site copy: business context, stakeholder
│   │                             # use cases, limitations, reflection content
│   └── formatting.ts
├── tests/                # Vitest: benchmark + unit tests for lib/analytics
├── DESIGN.md            # research + chosen art direction for the website
├── data/
│   ├── raw/          # untouched source data from data.gov.sg (gitignored)
│   └── processed/    # cleaned CSV + DuckDB database (gitignored);
│                      # web_export.json is the one exception -- see
│                      # "Deployment data architecture" below
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

This is local-only — the Streamlit dashboard is not publicly deployed.
It reads `data/processed/hdb_resale_clean.csv` directly with pandas.

## Website (Next.js analytical case study)

**Live:** https://hdb-resale-analytics.vercel.app/

The website is the deployed, public-facing product. It presents the same
findings and filters as the Streamlit dashboard, plus a business
case-study narrative (problem framing, executive insights, stakeholder
applications, conclusion, and analytical reflection — see "Key Findings,"
"Business Applications," and "Project Reflection" below). It ports the
dashboard's analytics logic into TypeScript (see `lib/analytics/`) rather
than reimplementing it from scratch — `app.py` remains the source of
truth it was ported from, and both are unit-tested against the same
approved benchmark numbers.

### Deployment data architecture

The website does **not** ship the 38 MB processed CSV to the browser, and
does not use the DuckDB database in production (that already
independently demonstrates SQL skills on its own, and isn't needed at
request time). Instead:

- The raw CSV, the cleaned CSV, and the DuckDB database are all excluded
  from Git (`data/raw/*`, `data/processed/*` in `.gitignore`) — none of
  the underlying transaction-level source data is published to the
  repository.
- A Python export script (`scripts/export_dashboard_data.py`) reduces the
  cleaned CSV to a compact, row-level JSON artifact,
  `data/processed/web_export.json`, containing only the columns the
  website actually uses. This one file is the single, deliberate
  exception carved out of the `data/processed/*` ignore rule, because the
  production `/api/analytics` endpoint needs it at runtime on Vercel
  (`next.config.ts` explicitly traces it into the deployed function
  bundle via `outputFileTracingIncludes`).
- A server-side loader reads that artifact once per server instance, and
  every filter change is aggregated server-side. **The browser only ever
  receives small, pre-aggregated JSON responses for the current
  filters — never raw transaction rows.**

See `DESIGN.md` for the full data-architecture rationale.

**1. Regenerate the website's data artifact** (only needed after changing
`data/processed/hdb_resale_clean.csv`; the current one is already
committed and deployed):

```bash
source venv/bin/activate
python scripts/export_dashboard_data.py
```

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

The website is deployed on Vercel at
https://hdb-resale-analytics.vercel.app/, building directly from this
repository.

## Key Findings

(Unfiltered, national, complete-year figures — see `docs/eda_findings.md`
for the full analysis and `sql/README.md` for the independent SQL
cross-validation.)

- **Market repricing:** median resale price rose from $410,000 (2017) to
  $628,000 (2025), approximately **+53.2%**; median price per sqm rose
  approximately **+51.8%** over the same span.
- **Geographic price-and-space trade-offs:** pooled median price per sqm
  varies materially by town — lower price per sqm can mean more floor
  area per dollar, but does not account for amenities, accessibility,
  flat age, or buyer preference.
- **Uneven town appreciation:** among towns with at least 30 transactions
  in both 2017 and 2025, median-price growth ranged from approximately
  **+15.1%** (Marine Parade) to **+76.4%** (Toa Payoh).
- **Expansion of the million-dollar segment:** transactions at or above
  $1,000,000 grew from approximately **0.22%** of trades in 2017 to
  **6.35%** in 2025.
- Remaining lease and storey height both show a consistent descriptive
  **association** with price per sqm — neither is presented as a causal
  effect.

## Business Applications

The live website's "From Analysis to Decision" section works through
specific stakeholder use cases; in summary:

| Stakeholder | Could support | Key limitation |
|---|---|---|
| Property advisory / agency | Comparing market segments for buyer enquiries | No unit condition, exact amenities, or individual buyer priorities |
| Property marketplace / content team | Identifying segments worth educational content | Historical growth does not imply future growth |
| Buyer research | Comparing broad price, size, lease, and storey trade-offs | Lower price per sqm isn't automatically better value for every buyer |
| Market / policy analyst | Monitoring broad price-level and transaction-composition changes | Affordability can't be measured without income, financing, and household data |

## Limitations

The dataset does not include buyer income or household circumstances,
mortgage or interest-rate information, unit condition or renovation
quality, exact accessibility/amenity measures, buyer motivations,
policy-impact attribution, a transaction identifier, or a causal
identification strategy. This analysis can describe *what* happened in
the resale market; it cannot on its own explain *why*, measure
affordability, or substitute for professional valuation or financial
advice. Full detail is in the website's "Methodology & Data Notes"
section and in `docs/data_cleaning.md`.

## Project Reflection

The most consequential analytical decisions made across this project:
using medians instead of means (skewed price distributions); detecting
complete calendar years dynamically rather than hardcoding a year;
excluding the latest incomplete month from full-year comparisons without
deleting it; preserving exact duplicate-looking rows (no transaction ID
exists to resolve the ambiguity); not removing outliers arbitrarily;
treating lease/storey relationships as associations, never causes;
applying a minimum-sample threshold to town appreciation rankings; and
cross-validating every headline figure between pandas and DuckDB SQL.
The website's TypeScript analytics layer was *ported* from the approved
Python logic and unit-tested against the same benchmarks, rather than
rebuilt independently — keeping one source of truth instead of two
implementations that could quietly drift apart. The full reasoning for
each decision is in the website's "Conclusion" section and in
`docs/data_cleaning.md` / `docs/eda_findings.md`.
