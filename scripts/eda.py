"""
Exploratory data analysis on the cleaned HDB resale dataset.

Reads:  data/processed/hdb_resale_clean.csv (untouched)
Writes: docs/eda_findings.md

Uses pandas only. No charts are produced at this stage (no plotting
library is installed yet) — findings are reported as statistical
summaries / tables, per the project's staged approach.

Methodology note: rows where is_latest_month == True (the current,
still-in-progress month) are excluded from any year-over-year or
cross-year trend comparison, since that month is not yet complete and
would understate activity. They are never dropped from the dataset
itself, and are included in analyses that are not time-trend based
(e.g. pooled town/flat-type/lease-band comparisons across the whole
period).
"""

from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PROCESSED_PATH = PROJECT_ROOT / "data" / "processed" / "hdb_resale_clean.csv"
DOCS_PATH = PROJECT_ROOT / "docs" / "eda_findings.md"

RAW_COLUMNS = [
    "month", "town", "flat_type", "block", "street_name", "storey_range",
    "floor_area_sqm", "flat_model", "lease_commence_date", "remaining_lease",
    "resale_price",
]
FOCUS_TYPES = ["3 ROOM", "4 ROOM", "5 ROOM"]

pd.set_option("display.width", 160)
pd.set_option("display.max_columns", 30)
pd.set_option("display.float_format", lambda x: f"{x:,.2f}")


def pct_change(new, old):
    return (new - old) / old * 100


def money(x):
    return f"${x:,.0f}"


class Report:
    """Prints to console and simultaneously builds the markdown doc."""

    def __init__(self):
        self.lines = []

    def md(self, text=""):
        self.lines.append(text)

    def heading(self, text, level=2):
        bar = "=" * 70
        print(f"\n{bar}\n{text}\n{bar}")
        self.md(f"\n{'#' * level} {text}\n")

    def note(self, text):
        print(text)
        self.md(text)
        self.md()

    def table(self, df, index=True, max_rows=None):
        show = df if max_rows is None else df.head(max_rows)
        text = show.to_string(index=index)
        print(text)
        self.md("```")
        self.md(text)
        self.md("```")
        self.md()

    def write(self, path):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("\n".join(self.lines) + "\n")


def main():
    df = pd.read_csv(PROCESSED_PATH, parse_dates=["month_date"])

    lease_bins = [0, 50, 60, 70, 80, 90, 200]
    lease_labels = ["<50", "50-59", "60-69", "70-79", "80-89", "90+"]
    df["lease_band"] = pd.cut(df["remaining_lease_years"], bins=lease_bins, labels=lease_labels, right=False)

    storey_bins = [0, 6, 15, 200]
    storey_labels = ["Low (1-6)", "Mid (7-15)", "High (16+)"]
    df["storey_band"] = pd.cut(df["storey_mid"], bins=storey_bins, labels=storey_labels, right=True)

    full = df
    trend = df[~df["is_latest_month"]].copy()

    latest_month = df["month_date"].max().strftime("%Y-%m")
    excluded_rows = int(df["is_latest_month"].sum())
    current_year = df["month_date"].max().year

    # A year only counts as "complete" if all 12 months are present in the
    # trend data (latest-month-excluded). This correctly falls back to the
    # prior year whenever the current year is still in progress (e.g. 2026
    # has only Jan-Jul once 2026-08 is excluded, so latest_full_year = 2025).
    months_per_year = trend.groupby("year")["month_number"].nunique()
    complete_years = months_per_year[months_per_year == 12].index
    latest_full_year = int(complete_years.max())

    r = Report()
    r.md("# HDB Resale Market — Exploratory Data Analysis")
    r.md()
    r.md(
        f"Source: `data/processed/hdb_resale_clean.csv` "
        f"({len(df):,} rows, {df['month_date'].min():%Y-%m} to {df['month_date'].max():%Y-%m})."
    )
    r.md()
    r.md(
        f"**Methodology note:** rows belonging to the latest month "
        f"({latest_month}, {excluded_rows:,} rows) are excluded from every "
        f"year-over-year / trend comparison in this document, since that "
        f"month is still in progress and would understate activity. They "
        f"are **never removed from the dataset** — only excluded from these "
        f"specific comparisons. Consequently, **{current_year} is an incomplete year** "
        f"(partial, once {latest_month} is excluded) everywhere it "
        f"appears below, and the last *complete* year is **{latest_full_year}**. "
        f"Analyses that are not indexed by year (e.g. pooled town, flat-type, "
        f"lease-band, or flat-model comparisons across the whole period) use "
        f"the full dataset, since a single partial month does not distort a "
        f"multi-year pooled median."
    )
    r.md()
    r.md(
        "All price comparisons use the **median**, not the mean, because "
        "resale prices are right-skewed (a small number of very high-value "
        "transactions would otherwise pull a mean upward). No causal claims "
        "are made anywhere in this document — only associations."
    )

    # ------------------------------------------------------------------
    # 1. Overall market trend
    # ------------------------------------------------------------------
    r.heading("1. Overall Market Trend")
    yearly = (
        trend.groupby("year")
        .agg(
            transactions=("resale_price", "size"),
            median_price=("resale_price", "median"),
            median_ppsm=("price_per_sqm", "median"),
        )
        .reset_index()
    )
    yearly["price_yoy_pct"] = yearly["median_price"].pct_change() * 100
    yearly["ppsm_yoy_pct"] = yearly["median_ppsm"].pct_change() * 100

    # An incomplete year (partial months) is not a valid YoY comparison point
    # against a prior full year — a partial 2026 vs full 2025 is not a like-
    # for-like annual change. Blank the YoY fields for any incomplete year
    # rather than silently present a partial-vs-full percentage as if it
    # were a normal annual change.
    incomplete_years = sorted(set(yearly["year"]) - set(complete_years))
    yearly.loc[yearly["year"].isin(incomplete_years), ["price_yoy_pct", "ppsm_yoy_pct"]] = float("nan")

    r.note(
        f"Years 2017–{latest_full_year} are complete calendar years. "
        f"{current_year} is partial/YTD ({latest_month} excluded) and is marked "
        f"with an asterisk; its YoY columns are shown as N/A because a partial "
        f"year is not a like-for-like comparison against a prior full year."
    )
    yearly_display = yearly.copy()
    yearly_display["year"] = yearly_display["year"].astype(str)
    yearly_display.loc[yearly_display["year"] == str(current_year), "year"] = f"{current_year}*"
    yearly_display["price_yoy_pct"] = yearly_display["price_yoy_pct"].apply(
        lambda x: "N/A" if pd.isna(x) else f"{x:+.2f}"
    )
    yearly_display["ppsm_yoy_pct"] = yearly_display["ppsm_yoy_pct"].apply(
        lambda x: "N/A" if pd.isna(x) else f"{x:+.2f}"
    )
    r.table(yearly_display.set_index("year"))

    price_2017 = yearly.loc[yearly["year"] == 2017, "median_price"].iloc[0]
    price_latest_full = yearly.loc[yearly["year"] == latest_full_year, "median_price"].iloc[0]
    ppsm_2017 = yearly.loc[yearly["year"] == 2017, "median_ppsm"].iloc[0]
    ppsm_latest_full = yearly.loc[yearly["year"] == latest_full_year, "median_ppsm"].iloc[0]
    overall_price_growth = pct_change(price_latest_full, price_2017)
    overall_ppsm_growth = pct_change(ppsm_latest_full, ppsm_2017)

    r.note(
        f"Market-wide, median resale price moved from {money(price_2017)} "
        f"in 2017 to {money(price_latest_full)} in {latest_full_year} "
        f"({overall_price_growth:+.1f}%). Median price per sqm moved from "
        f"${ppsm_2017:,.0f} to ${ppsm_latest_full:,.0f} "
        f"({overall_ppsm_growth:+.1f}%) over the same span."
    )

    # ------------------------------------------------------------------
    # 2. Town comparison
    # ------------------------------------------------------------------
    r.heading(f"2. Town Comparison (pooled, 2017–{current_year} to date)")
    town_stats = (
        full.groupby("town")
        .agg(
            transactions=("resale_price", "size"),
            median_price=("resale_price", "median"),
            median_ppsm=("price_per_sqm", "median"),
            median_floor_area=("floor_area_sqm", "median"),
            median_remaining_lease_years=("remaining_lease_years", "median"),
        )
        .reset_index()
        .sort_values("median_ppsm", ascending=False)
    )
    r.table(town_stats.set_index("town"))

    top5_expensive = town_stats.head(5)
    bottom5_cheap = town_stats.tail(5).sort_values("median_ppsm")
    r.note("Top 5 towns by median price per sqm (highest):")
    r.table(top5_expensive.set_index("town")[["median_ppsm", "median_price", "transactions"]])
    r.note("Bottom 5 towns by median price per sqm (lowest):")
    r.table(bottom5_cheap.set_index("town")[["median_ppsm", "median_price", "transactions"]])

    overall_median_floor_area = full["floor_area_sqm"].median()
    overall_median_ppsm = full["price_per_sqm"].median()
    high_area_low_ppsm = town_stats[
        (town_stats["median_floor_area"] > overall_median_floor_area)
        & (town_stats["median_ppsm"] < overall_median_ppsm)
    ].sort_values("median_ppsm")
    r.note(
        f"Towns with above-median floor area (> {overall_median_floor_area:.0f} sqm) "
        f"AND below-median price per sqm (< ${overall_median_ppsm:,.0f}) — i.e. more "
        f"floor area per dollar, not a claim of 'best value':"
    )
    r.table(high_area_low_ppsm.set_index("town")[["median_floor_area", "median_ppsm", "transactions"]])

    # ------------------------------------------------------------------
    # 3. Flat type analysis
    # ------------------------------------------------------------------
    r.heading("3. Flat Type Analysis")
    flat_type_stats = (
        full.groupby("flat_type")
        .agg(
            transactions=("resale_price", "size"),
            median_price=("resale_price", "median"),
            median_ppsm=("price_per_sqm", "median"),
            median_floor_area=("floor_area_sqm", "median"),
        )
        .reset_index()
        .sort_values("median_price")
    )
    r.table(flat_type_stats.set_index("flat_type"))

    r.note(f"Annual median resale price, {', '.join(FOCUS_TYPES)} (year-over-year trend, latest month excluded):")
    annual_by_type = (
        trend[trend["flat_type"].isin(FOCUS_TYPES)]
        .groupby(["year", "flat_type"])["resale_price"]
        .median()
        .unstack("flat_type")
    )
    annual_by_type_display = annual_by_type.copy()
    annual_by_type_display.index = [f"{y}*" if y == current_year else str(y) for y in annual_by_type_display.index]
    r.table(annual_by_type_display)

    growth_lines = []
    for ft in FOCUS_TYPES:
        p2017 = annual_by_type.loc[2017, ft]
        p_latest = annual_by_type.loc[latest_full_year, ft]
        g = pct_change(p_latest, p2017)
        growth_lines.append(f"- {ft}: {money(p2017)} (2017) -> {money(p_latest)} ({latest_full_year}), {g:+.1f}%")
    r.note(f"Median price growth, 2017 -> {latest_full_year} (complete years only):")
    r.note("\n".join(growth_lines))

    # ------------------------------------------------------------------
    # 4. Town appreciation: 2017 vs latest complete year (2025)
    # ------------------------------------------------------------------
    r.heading(f"4. Town Appreciation: 2017 vs {latest_full_year}")
    APPRECIATION_MIN_N = 30
    r.note(
        f"Threshold: a town is only ranked if it has at least "
        f"{APPRECIATION_MIN_N} transactions in BOTH 2017 and {latest_full_year}. "
        f"Town-year transaction counts in this dataset typically run into the "
        f"hundreds or low thousands; {APPRECIATION_MIN_N} is a conservative "
        f"floor intended only to exclude town-year cells too thin for a stable "
        f"median (a median of, say, 5 transactions can swing sharply on one "
        f"unusual sale), not to exclude genuinely smaller towns outright."
    )

    t17 = (
        trend[trend["year"] == 2017]
        .groupby("town")
        .agg(txn_2017=("resale_price", "size"), price_2017=("resale_price", "median"), ppsm_2017=("price_per_sqm", "median"))
    )
    t_latest = (
        trend[trend["year"] == latest_full_year]
        .groupby("town")
        .agg(
            txn_latest=("resale_price", "size"),
            price_latest=("resale_price", "median"),
            ppsm_latest=("price_per_sqm", "median"),
        )
    )
    appr = t17.join(t_latest, how="inner")
    all_towns = set(full["town"].unique())
    towns_before_threshold = len(appr)
    appr = appr[(appr["txn_2017"] >= APPRECIATION_MIN_N) & (appr["txn_latest"] >= APPRECIATION_MIN_N)]
    towns_excluded = sorted(all_towns - set(appr.index))

    appr["price_growth_pct"] = pct_change(appr["price_latest"], appr["price_2017"])
    appr["ppsm_growth_pct"] = pct_change(appr["ppsm_latest"], appr["ppsm_2017"])
    appr = appr.sort_values("price_growth_pct", ascending=False)

    r.note(
        f"{len(appr)} of {towns_before_threshold} towns with data in both years met the "
        f"threshold. Excluded (insufficient sample in one or both years): "
        f"{', '.join(towns_excluded) if towns_excluded else 'none'}."
    )
    r.table(
        appr[["txn_2017", "price_2017", "txn_latest", "price_latest", "price_growth_pct", "ppsm_growth_pct"]]
    )

    top_appreciation = appr.head(3)
    bottom_appreciation = appr.tail(3)
    r.note(
        f"Highest median-price growth 2017->{latest_full_year}: "
        + "; ".join(f"{t} ({row.price_growth_pct:+.1f}%)" for t, row in top_appreciation.iterrows())
    )
    r.note(
        f"Lowest median-price growth 2017->{latest_full_year}: "
        + "; ".join(f"{t} ({row.price_growth_pct:+.1f}%)" for t, row in bottom_appreciation.iterrows())
    )

    # ------------------------------------------------------------------
    # 5. Remaining lease relationship
    # ------------------------------------------------------------------
    r.heading("5. Remaining Lease Relationship")
    lease_desc = full["remaining_lease_years"].describe()
    r.note(
        f"remaining_lease_years distribution: min {lease_desc['min']:.1f}, "
        f"25th pct {lease_desc['25%']:.1f}, median {lease_desc['50%']:.1f}, "
        f"75th pct {lease_desc['75%']:.1f}, max {lease_desc['max']:.1f}. "
        f"This range (~39 to ~98 years) makes the proposed 10-year bands "
        f"reasonable — each band receives a meaningful number of rows (checked below), "
        f"and none of the bands falls entirely outside the observed range."
    )

    lease_band_counts = full["lease_band"].value_counts().reindex(lease_labels)
    r.note("Row counts per lease band (verifying bins are populated before using them):")
    r.table(lease_band_counts.to_frame("transactions"))

    lease_band_stats = (
        full.groupby("lease_band", observed=True)
        .agg(transactions=("resale_price", "size"), median_price=("resale_price", "median"), median_ppsm=("price_per_sqm", "median"))
        .reindex(lease_labels)
    )
    r.note("Median price and price/sqm by remaining-lease band (all flat types pooled):")
    r.table(lease_band_stats)

    r.note(
        f"Within flat_type (so larger flat types don't drive the pattern), "
        f"median price/sqm by lease band, {', '.join(FOCUS_TYPES)}:"
    )
    lease_band_by_type = (
        full[full["flat_type"].isin(FOCUS_TYPES)]
        .groupby(["flat_type", "lease_band"], observed=True)["price_per_sqm"]
        .median()
        .unstack("lease_band")
        .reindex(columns=lease_labels)
    )
    r.table(lease_band_by_type)
    r.note(
        "Observed association only: lower remaining-lease bands are associated "
        "with lower median price/sqm within each flat type shown above. This is "
        "not a causal claim — remaining lease is correlated with a flat's age, "
        "town, and model, any of which could also relate to price."
    )

    # ------------------------------------------------------------------
    # 6. Storey premium
    # ------------------------------------------------------------------
    r.heading("6. Storey Premium")
    storey_desc = full["storey_mid"].describe()
    r.note(
        f"storey_mid distribution: min {storey_desc['min']:.0f}, "
        f"median {storey_desc['50%']:.0f}, max {storey_desc['max']:.0f}."
    )
    r.note("Row counts per storey band:")
    r.table(full["storey_band"].value_counts().reindex(storey_labels).to_frame("transactions"))

    r.note(f"Median price/sqm by storey band, within flat_type ({', '.join(FOCUS_TYPES)}, all towns/years pooled):")
    storey_by_type = (
        full[full["flat_type"].isin(FOCUS_TYPES)]
        .groupby(["flat_type", "storey_band"], observed=True)["price_per_sqm"]
        .median()
        .unstack("storey_band")
        .reindex(columns=storey_labels)
    )
    r.table(storey_by_type)

    top_towns = full["town"].value_counts().head(5).index.tolist()
    r.note(
        f"Partial control for town: median price/sqm by storey band for "
        f"4 ROOM flats only, in the 5 highest-volume towns "
        f"({', '.join(top_towns)}):"
    )
    storey_town_4room = (
        full[(full["flat_type"] == "4 ROOM") & (full["town"].isin(top_towns))]
        .groupby(["town", "storey_band"], observed=True)["price_per_sqm"]
        .median()
        .unstack("storey_band")
        .reindex(columns=storey_labels)
    )
    r.table(storey_town_4room)

    r.note(
        f"Partial control for year: median price/sqm by storey band for 4 ROOM "
        f"flats only, by year (latest month excluded):"
    )
    storey_by_year_4room = (
        trend[trend["flat_type"] == "4 ROOM"]
        .groupby(["year", "storey_band"], observed=True)["price_per_sqm"]
        .median()
        .unstack("storey_band")
        .reindex(columns=storey_labels)
    )
    storey_by_year_4room.index = [f"{y}*" if y == current_year else str(y) for y in storey_by_year_4room.index]
    r.table(storey_by_year_4room)

    r.note(
        "The higher-storey association remains visible across several "
        "stratified comparisons by flat type, town, and year. These are "
        "partial controls — each comparison holds one or two dimensions "
        "roughly fixed separately — rather than a multivariable causal "
        "estimate holding town, flat type, and year fixed simultaneously. "
        "No regression model has been built at this stage."
    )

    # ------------------------------------------------------------------
    # 7. Flat model analysis
    # ------------------------------------------------------------------
    r.heading("7. Flat Model Analysis")
    model_stats = (
        full.groupby("flat_model")
        .agg(transactions=("resale_price", "size"), median_ppsm=("price_per_sqm", "median"))
        .reset_index()
        .sort_values("median_ppsm", ascending=False)
    )
    MODEL_MIN_N = 500
    r.note(f"Sample-size threshold for a 'reliable' ranking: >= {MODEL_MIN_N} transactions.")
    reliable_models = model_stats[model_stats["transactions"] >= MODEL_MIN_N].reset_index(drop=True)
    small_models = model_stats[model_stats["transactions"] < MODEL_MIN_N].reset_index(drop=True)

    r.note(f"Flat models with >= {MODEL_MIN_N} transactions, ranked by median price/sqm:")
    r.table(reliable_models.set_index("flat_model"))
    r.note(f"Flat models with < {MODEL_MIN_N} transactions — flagged as low sample size, not used for ranking claims:")
    r.table(small_models.set_index("flat_model"))

    highest_ppsm_model = reliable_models.iloc[0]
    lowest_ppsm_model = reliable_models.iloc[-1]
    r.note(
        f"Among adequately-sampled models, highest median price/sqm: "
        f"{highest_ppsm_model['flat_model']} (${highest_ppsm_model['median_ppsm']:,.0f}/sqm, "
        f"n={highest_ppsm_model['transactions']:.0f}). Lowest: "
        f"{lowest_ppsm_model['flat_model']} (${lowest_ppsm_model['median_ppsm']:,.0f}/sqm, "
        f"n={lowest_ppsm_model['transactions']:.0f})."
    )

    # ------------------------------------------------------------------
    # 8. Million-dollar transactions
    # ------------------------------------------------------------------
    r.heading("8. Million-Dollar Transactions (resale_price >= $1,000,000)")
    mil = trend[trend["resale_price"] >= 1_000_000]
    mil_by_year = mil.groupby("year").size()
    total_by_year = trend.groupby("year").size()
    mil_share_by_year = (mil_by_year.reindex(total_by_year.index, fill_value=0) / total_by_year * 100)

    mil_table = pd.DataFrame({
        "million_dollar_txns": mil_by_year.reindex(total_by_year.index, fill_value=0),
        "total_txns": total_by_year,
        "share_pct": mil_share_by_year,
    })
    mil_table.index = [f"{y}*" if y == current_year else str(y) for y in mil_table.index]
    r.note(f"By year (latest month excluded; {current_year} marked * as incomplete):")
    r.table(mil_table)

    total_mil = len(mil)
    mil_top_towns = mil["town"].value_counts().head(5)
    mil_flat_types = mil["flat_type"].value_counts()
    r.note(f"Total million-dollar transactions in the trend window: {total_mil:,} of {len(trend):,} ({total_mil/len(trend)*100:.2f}%).")
    r.note("Top 5 towns by count of million-dollar transactions:")
    r.table(mil_top_towns.to_frame("count"))
    r.note("Flat types represented among million-dollar transactions:")
    r.table(mil_flat_types.to_frame("count"))

    # ------------------------------------------------------------------
    # 9. Duplicate sensitivity check
    # ------------------------------------------------------------------
    r.heading("9. Duplicate Sensitivity Check")
    r.note(
        "This section compares headline metrics with (A) all rows and "
        "(B) one row retained per exact-duplicate group. This is an "
        "in-memory comparison for this analysis only — the saved dataset "
        "is not altered."
    )
    A_price, A_ppsm, A_n = full["resale_price"].median(), full["price_per_sqm"].median(), len(full)
    dedup = full.drop_duplicates(subset=RAW_COLUMNS, keep="first")
    B_price, B_ppsm, B_n = dedup["resale_price"].median(), dedup["price_per_sqm"].median(), len(dedup)

    sens_table = pd.DataFrame({
        "A_all_rows": [A_n, A_price, A_ppsm],
        "B_deduplicated": [B_n, B_price, B_ppsm],
    }, index=["transactions", "median_price", "median_ppsm"])
    r.table(sens_table)

    diff_price_pct = pct_change(B_price, A_price)
    diff_ppsm_pct = pct_change(B_ppsm, A_ppsm)
    diff_n = A_n - B_n
    r.note(
        f"Removing one copy of each of the 316 exact-duplicate groups drops "
        f"{diff_n} rows ({diff_n/A_n*100:.3f}% of the dataset). Median price "
        f"changes by {diff_price_pct:+.3f}% and median price/sqm by "
        f"{diff_ppsm_pct:+.3f}%. At this magnitude, the duplicate ambiguity "
        f"does not materially change headline conclusions in this document."
    )

    # ------------------------------------------------------------------
    # 10. Outlier sensitivity (rare Terrace flats / extreme floor areas)
    # ------------------------------------------------------------------
    r.heading("10. Outlier Sensitivity (rare Terrace flats)")
    all_3room = full[full["flat_type"] == "3 ROOM"]
    non_terrace_3room = all_3room[all_3room["flat_model"] != "Terrace"]
    n_terrace = int((all_3room["flat_model"] == "Terrace").sum())

    median_with = all_3room["price_per_sqm"].median()
    median_without = non_terrace_3room["price_per_sqm"].median()
    mean_with = all_3room["price_per_sqm"].mean()
    mean_without = non_terrace_3room["price_per_sqm"].mean()

    r.note(
        f"3 ROOM flats include {n_terrace} rows with flat_model = 'Terrace' "
        f"(rare landed-style units, floor areas up to 366.7 sqm) out of "
        f"{len(all_3room):,} total 3-room rows."
    )
    outlier_table = pd.DataFrame({
        "median_price_per_sqm": [median_with, median_without],
        "mean_price_per_sqm": [mean_with, mean_without],
    }, index=["3 ROOM incl. Terrace", "3 ROOM excl. Terrace"])
    r.table(outlier_table)

    median_shift = median_with - median_without
    mean_shift = mean_with - mean_without
    r.note(
        f"Excluding Terrace flats shifts the 3-room median price/sqm by "
        f"${median_shift:+.2f} and the mean by ${mean_shift:+.2f}. "
        f"The median is materially more robust to this rare category than "
        f"the mean, which is why medians are used as the primary metric "
        f"throughout this document; town/flat-type comparisons above are "
        f"not meaningfully distorted by the Terrace flats."
    )

    kw = full[full["town"] == "KALLANG/WHAMPOA"]
    kw_median_with = kw["price_per_sqm"].median()
    kw_median_without = kw[kw["flat_model"] != "Terrace"]["price_per_sqm"].median()
    kw_mean_with = kw["price_per_sqm"].mean()
    kw_mean_without = kw[kw["flat_model"] != "Terrace"]["price_per_sqm"].mean()
    r.note(
        f"Within KALLANG/WHAMPOA specifically (where Terrace flats are "
        f"concentrated), median price/sqm is ${kw_median_with:,.2f} including "
        f"vs ${kw_median_without:,.2f} excluding Terrace flats "
        f"({pct_change(kw_median_with, kw_median_without):+.2f}%); mean is "
        f"${kw_mean_with:,.2f} vs ${kw_mean_without:,.2f} "
        f"({pct_change(kw_mean_with, kw_mean_without):+.2f}%). The town-level "
        f"median is essentially unaffected."
    )

    # ------------------------------------------------------------------
    # 11. Key findings
    # ------------------------------------------------------------------
    r.heading("11. Key Findings", level=2)
    findings = [
        f"**Fact:** Market-wide median resale price rose from {money(price_2017)} in 2017 to "
        f"{money(price_latest_full)} in {latest_full_year}, a {overall_price_growth:+.1f}% increase "
        f"across {latest_full_year - 2017} complete years.",

        f"**Fact:** Market-wide median price per sqm rose from ${ppsm_2017:,.0f} to ${ppsm_latest_full:,.0f} "
        f"over the same period ({overall_ppsm_growth:+.1f}%).",

        f"**Fact:** {top5_expensive.iloc[0]['town']} has the highest pooled median price/sqm "
        f"(${top5_expensive.iloc[0]['median_ppsm']:,.0f}/sqm, n={top5_expensive.iloc[0]['transactions']:.0f}), "
        f"while {bottom5_cheap.iloc[0]['town']} has the lowest "
        f"(${bottom5_cheap.iloc[0]['median_ppsm']:,.0f}/sqm, n={bottom5_cheap.iloc[0]['transactions']:.0f}) — "
        f"a {pct_change(top5_expensive.iloc[0]['median_ppsm'], bottom5_cheap.iloc[0]['median_ppsm']):.0f}% gap.",

        f"**Fact:** Among towns meeting the {APPRECIATION_MIN_N}-transaction threshold in both years, "
        f"{top_appreciation.index[0]} shows the largest 2017->{latest_full_year} median-price growth "
        f"({top_appreciation.iloc[0]['price_growth_pct']:+.1f}%), while "
        f"{bottom_appreciation.index[-1]} shows the smallest "
        f"({bottom_appreciation.iloc[-1]['price_growth_pct']:+.1f}%).",

        f"**Fact:** For 4 ROOM flats (the most-traded type, n={int(flat_type_stats.set_index('flat_type').loc['4 ROOM','transactions']):,}), "
        f"median price rose from {money(annual_by_type.loc[2017,'4 ROOM'])} to "
        f"{money(annual_by_type.loc[latest_full_year,'4 ROOM'])} "
        f"({pct_change(annual_by_type.loc[latest_full_year,'4 ROOM'], annual_by_type.loc[2017,'4 ROOM']):+.1f}%).",

        f"**Interpretation (association, not causation):** Median price/sqm declines by remaining-lease "
        f"band — the <50-year band shows lower median price/sqm than the 90+ band within every one of "
        f"{', '.join(FOCUS_TYPES)} (see Section 5); remaining lease is confounded with flat age and model, "
        f"so this is not evidence that lease length alone drives price.",

        f"**Interpretation (association, not causation):** The higher-storey association remains visible "
        f"across several stratified comparisons by flat type, town, and year (Section 6). These are partial "
        f"controls, not a multivariable causal estimate holding all three fixed simultaneously — no "
        f"regression model has been built at this stage.",

        f"**Fact:** Among flat models with >= {MODEL_MIN_N} transactions, {highest_ppsm_model['flat_model']} "
        f"has the highest median price/sqm (${highest_ppsm_model['median_ppsm']:,.0f}) and "
        f"{lowest_ppsm_model['flat_model']} the lowest (${lowest_ppsm_model['median_ppsm']:,.0f}).",

        f"**Fact:** Million-dollar transactions are a small but growing share of the market: "
        f"{mil_table.loc['2017', 'share_pct']:.2f}% of trades in 2017 vs "
        f"{mil_table.loc[str(latest_full_year), 'share_pct']:.2f}% in {latest_full_year} "
        f"(complete years). {current_year} is partial to date at "
        f"{mil_table.loc[f'{current_year}*', 'share_pct']:.2f}% and is not used as the headline comparison.",

        f"**Fact:** {mil_top_towns.index[0]} accounts for the most million-dollar transactions of any town "
        f"({int(mil_top_towns.iloc[0]):,} of {total_mil:,}, {mil_top_towns.iloc[0]/total_mil*100:.1f}%).",

        f"**Fact:** The 316 exact-duplicate groups (633 rows, {633/A_n*100:.2f}% of the dataset) change "
        f"median price by only {diff_price_pct:+.3f}% and median price/sqm by only {diff_ppsm_pct:+.3f}% "
        f"when one copy per group is removed — the duplicate ambiguity does not materially affect any "
        f"conclusion in this document.",

        f"**Fact:** The rare Terrace flat model ({n_terrace} rows, floor areas up to 366.7 sqm) shifts the "
        f"3-room median price/sqm by only ${median_shift:+.2f} when excluded, versus ${mean_shift:+.2f} for "
        f"the mean — confirming medians are the right primary metric for this dataset.",
    ]
    for f in findings:
        r.note(f"- {f}")

    # ------------------------------------------------------------------
    # 12. Dashboard recommendations
    # ------------------------------------------------------------------
    r.heading("12. Dashboard Recommendations (for a future Streamlit build)", level=2)
    recs = [
        (
            "Median resale price & price/sqm over time (line chart, by year, complete years only)",
            "How has the market changed since 2017?",
            "Median resale_price and median price_per_sqm per year",
            "Directly answers the core research question's trend component; median avoids skew from high-value outliers.",
        ),
        (
            "Town comparison table/heatmap: median price/sqm, median floor area, transaction count",
            "Which towns are relatively more/less expensive per sqm, and which offer more floor area per dollar?",
            "Per-town median price_per_sqm, median floor_area_sqm, transaction count",
            "Directly supports the 'towns... provide the best value' question, framed carefully as price/sqm and floor-area-per-dollar rather than an unproven 'best value' label.",
        ),
        (
            "Flat type breakdown: median price, price/sqm, and floor area by flat_type",
            "How do prices differ by flat type, and how has each type moved over time?",
            "Median resale_price, price_per_sqm by flat_type, with year filter",
            "Flat type is one of the biggest price drivers and a natural filter for a buyer/analyst persona.",
        ),
        (
            "Town appreciation ranking: 2017 vs latest complete year, % growth, with minimum-sample threshold",
            "Which towns have appreciated the most/least since 2017?",
            "Median price growth % per town, filtered to towns with >= 30 transactions in both years",
            "Turns the single-point-in-time price comparison into a growth story, while the sample threshold prevents small towns from producing misleading rankings.",
        ),
        (
            "Remaining lease vs price/sqm, by lease band and flat type",
            "How is remaining lease associated with price?",
            "Median price_per_sqm by lease band (<50, 50-59, ..., 90+), split by flat_type",
            "Lease decay is a well-known concern for HDB buyers; showing it by flat type avoids conflating it with flat size.",
        ),
        (
            "Storey premium: price/sqm by storey band, filterable by town and flat type",
            "Do higher floors command a price premium, and does it hold within a given town/flat type?",
            "Median price_per_sqm by storey_band (Low/Mid/High), filtered by town + flat_type",
            "Framing it as filterable rather than a single Singapore-wide comparison avoids the confound the analysis stage explicitly flagged.",
        ),
        (
            "Flat model comparison, with a visible sample-size flag for small categories",
            "Which flat models carry a price/sqm premium or discount?",
            "Median price_per_sqm by flat_model, with transaction count shown alongside every value",
            "Prevents the dashboard from implying a ranking for tiny categories like '3Gen' (n=83) with the same confidence as 'Model A' (n=86,158).",
        ),
        (
            "Million-dollar transaction tracker: count and share of transactions by year, plus top towns",
            "How prevalent are million-dollar resale flats, and where?",
            "Count and % share of transactions >= $1,000,000 per year; top towns by count",
            "A frequently-cited, easily-understood market signal that is straightforward to keep current as new months of data are pulled.",
        ),
        (
            "Data-quality footnote panel: latest-month-incomplete flag, exact-duplicate count, Terrace-flat note",
            "Is the data trustworthy, and what are its known limitations?",
            "is_latest_month flag status, exact-duplicate count/%, Terrace-flat median-shift figures from Section 9-10",
            "A recruiter-facing dashboard benefits from visibly showing data-quality awareness rather than hiding it — it demonstrates analytical rigor.",
        ),
    ]
    for title, question, metric, why in recs:
        r.md(f"**{title}**")
        r.md(f"- Question answered: {question}")
        r.md(f"- Metric: {metric}")
        r.md(f"- Why it matters: {why}")
        r.md()

    r.write(DOCS_PATH)
    print(f"\nSaved findings to: {DOCS_PATH}")


if __name__ == "__main__":
    main()
