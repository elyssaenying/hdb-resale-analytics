"""
Singapore HDB Resale Market Analytics — Streamlit dashboard.

Loads the already-cleaned dataset (data/processed/hdb_resale_clean.csv)
and presents an interactive view of the same findings validated in the
Python EDA and DuckDB SQL stages. This stage does not depend on the
DuckDB database — pandas is simpler for interactive filtering, and the
SQL layer already independently demonstrates SQL skills on its own.

Complete-year logic (latest_month / complete_years / latest_complete_year)
is recomputed from the data on every load, using the same methodology
approved in the EDA/SQL stages. No year is hardcoded.
"""

from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

PROJECT_ROOT = Path(__file__).resolve().parent
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "hdb_resale_clean.csv"

BASELINE_YEAR = 2017
APPRECIATION_MIN_N = 30
FOCUS_TYPES = ["3 ROOM", "4 ROOM", "5 ROOM"]

LEASE_BINS = [0, 50, 60, 70, 80, 90, 200]
LEASE_LABELS = ["<50", "50-59", "60-69", "70-79", "80-89", "90+"]
STOREY_BINS = [0, 6, 15, 200]
STOREY_LABELS = ["Low (1-6)", "Mid (7-15)", "High (16+)"]

st.set_page_config(
    page_title="Singapore HDB Resale Market Analytics",
    page_icon="🏠",
    layout="wide",
)


# ----------------------------------------------------------------------
# Data loading
# ----------------------------------------------------------------------
@st.cache_data
def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH, parse_dates=["month_date"])
    df["lease_band"] = pd.cut(
        df["remaining_lease_years"], bins=LEASE_BINS, labels=LEASE_LABELS, right=False
    )
    df["storey_band"] = pd.cut(
        df["storey_mid"], bins=STOREY_BINS, labels=STOREY_LABELS, right=True
    )
    return df


def get_year_metadata(df: pd.DataFrame) -> dict:
    """Complete-year detection: same methodology as the EDA/SQL stages.

    A year counts as complete only if all 12 calendar months are present
    after excluding the in-progress latest month. Nothing here is
    hardcoded to a specific year.
    """
    trend = df[~df["is_latest_month"]]
    latest_month = df["month_date"].max()
    months_per_year = trend.groupby("year")["month_number"].nunique()
    complete_years = sorted(months_per_year[months_per_year == 12].index.tolist())
    latest_complete_year = max(complete_years) if complete_years else None
    return {
        "latest_month": latest_month,
        "current_year": int(latest_month.year),
        "complete_years": complete_years,
        "latest_complete_year": latest_complete_year,
    }


def money(x) -> str:
    return "N/A" if pd.isna(x) else f"${x:,.0f}"


def pct(x) -> str:
    return "N/A" if pd.isna(x) else f"{x:+.1f}%"


# ----------------------------------------------------------------------
# Load + header
# ----------------------------------------------------------------------
df = load_data()
meta = get_year_metadata(df)
complete_years = meta["complete_years"]
latest_complete_year = meta["latest_complete_year"]
latest_month = meta["latest_month"]

st.title("Singapore HDB Resale Market Analytics")
st.caption(
    "An interactive analysis of HDB resale transactions from 2017 onwards "
    "using official data.gov.sg data."
)
st.info(
    f"Latest available month: {latest_month:%Y-%m}  \n"
    f"Latest complete year: {latest_complete_year}  \n"
    f"Latest month is excluded from full-year comparisons.",
    icon="ℹ️",
)

# ----------------------------------------------------------------------
# Sidebar filters
# ----------------------------------------------------------------------
st.sidebar.header("Filters")
all_towns = sorted(df["town"].unique())
all_flat_types = sorted(df["flat_type"].unique())

selected_towns = st.sidebar.multiselect("Town", options=all_towns, default=all_towns)
selected_flat_types = st.sidebar.multiselect(
    "Flat Type", options=all_flat_types, default=all_flat_types
)
include_partial = st.sidebar.checkbox("Include partial-year data (YTD)", value=False)
st.sidebar.caption(
    f"When off, only complete calendar years ({complete_years[0]}–{complete_years[-1]}) "
    f"are used. When on, {meta['current_year']} YTD is also included, clearly labelled "
    f"as partial."
)

if not selected_towns or not selected_flat_types:
    st.warning("Select at least one town and one flat type to see results.")
    st.stop()

# Base filtered dataset. trend_base always excludes the in-progress latest
# month -- it feeds the KPI snapshot, the 2017 -> latest-complete-year
# growth caption, town appreciation, and the million-dollar historical
# chart, none of which should ever be affected by the partial-year toggle.
base = df[df["town"].isin(selected_towns) & df["flat_type"].isin(selected_flat_types)]
trend_base = base[~base["is_latest_month"]]

# analysis_df feeds the trend/town/flat-type/lease/storey charts. When the
# toggle is on, it includes the latest (possibly partial) month's rows too
# -- those rows are never treated as a complete year, only shown as
# additional partial/YTD data points.
if include_partial:
    analysis_df = base
else:
    analysis_df = trend_base[trend_base["year"].isin(complete_years)]

if analysis_df.empty:
    st.warning("No transactions match the current filters.")
    st.stop()

# ----------------------------------------------------------------------
# F. Top KPI row — always the latest COMPLETE year, regardless of the
#    partial-year toggle (this is a fixed "market snapshot" anchor).
# ----------------------------------------------------------------------
st.subheader(f"{latest_complete_year} Market Snapshot")
kpi_df = trend_base[trend_base["year"] == latest_complete_year]

if kpi_df.empty:
    st.info(f"No transactions for {latest_complete_year} under the current filters.")
else:
    median_price = kpi_df["resale_price"].median()
    median_ppsm = kpi_df["price_per_sqm"].median()
    transactions = len(kpi_df)
    million_share = (kpi_df["resale_price"] >= 1_000_000).mean() * 100

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Median Resale Price", money(median_price))
    c2.metric("Median Price / sqm", money(median_ppsm))
    c3.metric("Transactions", f"{transactions:,}")
    c4.metric("Million-Dollar Share", f"{million_share:.2f}%")

# ----------------------------------------------------------------------
# G. Visual 1 — Market trend
# ----------------------------------------------------------------------
st.markdown("---")
st.subheader("Market Trend Since 2017")
st.caption("How has the resale market changed since 2017?")

metric_choice = st.radio(
    "Metric",
    options=["Median resale price", "Median price per sqm"],
    horizontal=True,
    label_visibility="collapsed",
)
metric_col = "resale_price" if metric_choice == "Median resale price" else "price_per_sqm"

yearly = (
    analysis_df.groupby("year")
    .agg(median_value=(metric_col, "median"), transactions=(metric_col, "size"))
    .reset_index()
)
yearly["is_complete_year"] = yearly["year"].isin(complete_years)

if yearly.empty:
    st.info("No data available for the trend chart under current filters.")
else:
    complete_mask = yearly["is_complete_year"]
    fig1 = go.Figure()
    fig1.add_trace(
        go.Scatter(
            x=yearly.loc[complete_mask, "year"],
            y=yearly.loc[complete_mask, "median_value"],
            mode="lines+markers",
            name="Complete years",
            line=dict(color="#2E5EAA"),
            marker=dict(size=8),
            customdata=yearly.loc[complete_mask, "transactions"],
            hovertemplate=(
                "Year %{x}<br>" + metric_choice + ": $%{y:,.0f}"
                "<br>Transactions: %{customdata:,}<extra></extra>"
            ),
        )
    )
    if (~complete_mask).any():
        partial = yearly.loc[~complete_mask].sort_values("year")
        last_complete = yearly.loc[complete_mask].sort_values("year").iloc[-1:]
        bridge = pd.concat([last_complete, partial])
        fig1.add_trace(
            go.Scatter(
                x=bridge["year"],
                y=bridge["median_value"],
                mode="lines",
                line=dict(color="#E07A2C", dash="dot"),
                showlegend=False,
                hoverinfo="skip",
            )
        )
        fig1.add_trace(
            go.Scatter(
                x=partial["year"],
                y=partial["median_value"],
                mode="markers",
                name="Partial/YTD",
                marker=dict(size=11, color="#E07A2C", symbol="diamond"),
                customdata=partial["transactions"],
                hovertemplate=(
                    "Year %{x} (partial/YTD)<br>" + metric_choice + ": $%{y:,.0f}"
                    "<br>Transactions: %{customdata:,}<extra></extra>"
                ),
            )
        )

    fig1.update_layout(
        xaxis_title="Year",
        yaxis_title=metric_choice,
        yaxis_tickprefix="$",
        yaxis_tickformat=",.0f",
        xaxis=dict(dtick=1),
        height=420,
        margin=dict(t=20, b=20),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, x=0),
    )
    st.plotly_chart(fig1, width="stretch")

# Growth caption: always 2017 -> latest complete year, computed
# dynamically, regardless of the partial-year toggle.
growth_base = trend_base[trend_base["year"].isin([BASELINE_YEAR, latest_complete_year])]
price_2017 = growth_base.loc[growth_base["year"] == BASELINE_YEAR, "resale_price"].median()
price_latest = growth_base.loc[growth_base["year"] == latest_complete_year, "resale_price"].median()
ppsm_2017 = growth_base.loc[growth_base["year"] == BASELINE_YEAR, "price_per_sqm"].median()
ppsm_latest = growth_base.loc[growth_base["year"] == latest_complete_year, "price_per_sqm"].median()

if pd.notna(price_2017) and price_2017 and pd.notna(price_latest) and pd.notna(ppsm_2017) and ppsm_2017:
    price_growth = (price_latest - price_2017) / price_2017 * 100
    ppsm_growth = (ppsm_latest - ppsm_2017) / ppsm_2017 * 100
    st.caption(
        f"{BASELINE_YEAR} → {latest_complete_year} growth: "
        f"median price {pct(price_growth)}, median price/sqm {pct(ppsm_growth)}."
    )
else:
    st.caption(
        f"Not enough data in both {BASELINE_YEAR} and {latest_complete_year} "
        f"under current filters to compute growth."
    )

# ----------------------------------------------------------------------
# H. Visual 2 — Town comparison
# ----------------------------------------------------------------------
st.markdown("---")
st.subheader("Median Price per sqm by Town")
st.caption("Which towns are relatively more or less expensive per sqm?")

town_stats = (
    analysis_df.groupby("town")
    .agg(
        median_ppsm=("price_per_sqm", "median"),
        median_price=("resale_price", "median"),
        transactions=("resale_price", "size"),
    )
    .reset_index()
    .sort_values("median_ppsm")
)

if town_stats.empty:
    st.info("No town data available under current filters.")
else:
    fig2 = px.bar(
        town_stats,
        x="median_ppsm",
        y="town",
        orientation="h",
        hover_data={
            "median_price": ":$,.0f",
            "transactions": ":,",
            "median_ppsm": ":$,.0f",
        },
        labels={"median_ppsm": "Median Price per sqm", "town": "Town"},
        height=max(420, 24 * len(town_stats)),
    )
    fig2.update_layout(xaxis_tickprefix="$", margin=dict(t=20, b=20))
    st.plotly_chart(fig2, width="stretch")
    st.caption(
        "Lower price per sqm means more floor area per dollar, but does not "
        "account for location, flat age, amenities, or other buyer preferences."
    )

# ----------------------------------------------------------------------
# I. Visual 3 — Flat type comparison
# ----------------------------------------------------------------------
st.markdown("---")
st.subheader("Flat Type Comparison")
st.caption("How do HDB flat types differ in price and size?")

flat_stats = (
    analysis_df.groupby("flat_type")
    .agg(
        median_price=("resale_price", "median"),
        median_ppsm=("price_per_sqm", "median"),
        median_floor_area=("floor_area_sqm", "median"),
        transactions=("resale_price", "size"),
    )
    .reset_index()
    .sort_values("median_price")
)

if flat_stats.empty:
    st.info("No flat type data available under current filters.")
else:
    fig3 = px.bar(
        flat_stats,
        x="flat_type",
        y="median_price",
        hover_data={
            "median_ppsm": ":$,.0f",
            "median_floor_area": ":.0f",
            "transactions": ":,",
            "median_price": ":$,.0f",
        },
        labels={"median_price": "Median Resale Price", "flat_type": "Flat Type"},
        height=420,
    )
    fig3.update_layout(yaxis_tickprefix="$", margin=dict(t=20, b=20))
    st.plotly_chart(fig3, width="stretch")

# ----------------------------------------------------------------------
# J. Visual 4 — Town appreciation (2017 vs latest complete year)
# ----------------------------------------------------------------------
st.markdown("---")
st.subheader("Town Appreciation")
st.caption(f"Which towns experienced the strongest median-price growth since {BASELINE_YEAR}?")

appr_base = trend_base[trend_base["year"].isin([BASELINE_YEAR, latest_complete_year])]
cell_stats = (
    appr_base.groupby(["town", "year"])
    .agg(median_price=("resale_price", "median"), transactions=("resale_price", "size"))
    .reset_index()
)
txn_pivot = cell_stats.pivot(index="town", columns="year", values="transactions")
price_pivot = cell_stats.pivot(index="town", columns="year", values="median_price")

if BASELINE_YEAR not in txn_pivot.columns or latest_complete_year not in txn_pivot.columns:
    st.info(
        f"Not enough data in both {BASELINE_YEAR} and {latest_complete_year} "
        f"under current filters."
    )
else:
    qualified = txn_pivot[
        (txn_pivot[BASELINE_YEAR] >= APPRECIATION_MIN_N)
        & (txn_pivot[latest_complete_year] >= APPRECIATION_MIN_N)
    ].index

    if len(qualified) == 0:
        st.info(
            f"No towns have at least {APPRECIATION_MIN_N} transactions in both "
            f"{BASELINE_YEAR} and {latest_complete_year} under the current filters, "
            f"so a stable appreciation ranking cannot be shown."
        )
    else:
        growth = pd.DataFrame(
            {
                "town": qualified,
                "price_2017": price_pivot.loc[qualified, BASELINE_YEAR].values,
                "price_latest": price_pivot.loc[qualified, latest_complete_year].values,
            }
        )
        growth["growth_pct"] = (
            (growth["price_latest"] - growth["price_2017"]) / growth["price_2017"] * 100
        )
        growth = growth.sort_values("growth_pct")

        fig4 = px.bar(
            growth,
            x="growth_pct",
            y="town",
            orientation="h",
            hover_data={
                "price_2017": ":$,.0f",
                "price_latest": ":$,.0f",
                "growth_pct": ":.1f",
            },
            labels={
                "growth_pct": f"Median Price Growth {BASELINE_YEAR}→{latest_complete_year} (%)",
                "town": "Town",
            },
            height=max(420, 24 * len(growth)),
        )
        fig4.update_layout(margin=dict(t=20, b=20))
        st.plotly_chart(fig4, width="stretch")
        st.caption(
            f"Only towns with ≥{APPRECIATION_MIN_N} transactions in both "
            f"{BASELINE_YEAR} and {latest_complete_year} are shown ({len(qualified)} "
            f"of {txn_pivot.shape[0]} towns qualified)."
        )

# ----------------------------------------------------------------------
# K. Visual 5 — Remaining lease
# ----------------------------------------------------------------------
st.markdown("---")
st.subheader("Remaining Lease vs Price per sqm")
st.caption("How is remaining lease associated with price per sqm?")

# Never introduce a flat type the sidebar filter excluded. If 1-3 types
# are selected, show exactly those. If more than 3 are selected, prefer
# the 3/4/5 ROOM focus types -- but only whichever of them are actually
# in the selection. If none of the focus types were selected, aggregate
# across the selected types instead of silently ignoring the filter.
if len(selected_flat_types) <= 3:
    lease_flat_types = selected_flat_types
    lease_group_by_type = True
    lease_note = ""
else:
    focus_in_selection = [ft for ft in FOCUS_TYPES if ft in selected_flat_types]
    if len(focus_in_selection) == 3:
        lease_flat_types = FOCUS_TYPES
        lease_group_by_type = True
        lease_note = " Showing 3 ROOM / 4 ROOM / 5 ROOM (of the selected flat types), for readability."
    elif focus_in_selection:
        lease_flat_types = focus_in_selection
        lease_group_by_type = True
        lease_note = f" Showing {', '.join(focus_in_selection)} (of the selected flat types), for readability."
    else:
        lease_flat_types = selected_flat_types
        lease_group_by_type = False
        lease_note = " Showing an aggregated view across all selected flat types, for readability."

lease_data = analysis_df[analysis_df["flat_type"].isin(lease_flat_types)]

if lease_group_by_type:
    lease_stats = (
        lease_data.groupby(["lease_band", "flat_type"], observed=True)
        .agg(median_ppsm=("price_per_sqm", "median"), transactions=("resale_price", "size"))
        .reset_index()
    )
    lease_color = "flat_type"
else:
    lease_stats = (
        lease_data.groupby("lease_band", observed=True)
        .agg(median_ppsm=("price_per_sqm", "median"), transactions=("resale_price", "size"))
        .reset_index()
    )
    lease_color = None

if lease_stats.empty:
    st.info("No data available for the lease-band chart under current filters.")
else:
    fig5 = px.bar(
        lease_stats,
        x="lease_band",
        y="median_ppsm",
        color=lease_color,
        barmode="group",
        category_orders={"lease_band": LEASE_LABELS},
        hover_data={"transactions": ":,", "median_ppsm": ":$,.0f"},
        labels={
            "median_ppsm": "Median Price per sqm",
            "lease_band": "Remaining Lease (years)",
            "flat_type": "Flat Type",
        },
        height=420,
    )
    fig5.update_layout(yaxis_tickprefix="$", margin=dict(t=20, b=20))
    st.plotly_chart(fig5, width="stretch")

st.caption(
    "This is an observed association, not a causal estimate. Remaining lease "
    "is also related to flat age, town, and flat model." + lease_note
)

# ----------------------------------------------------------------------
# L. Visual 6 — Storey association
# ----------------------------------------------------------------------
st.markdown("---")
st.subheader("Storey Band vs Price per sqm")
st.caption("Are higher-storey flats associated with higher price per sqm?")

storey_stats = (
    analysis_df.groupby("storey_band", observed=True)
    .agg(median_ppsm=("price_per_sqm", "median"), transactions=("resale_price", "size"))
    .reset_index()
)

if storey_stats.empty:
    st.info("No data available for the storey-band chart under current filters.")
else:
    fig6 = px.bar(
        storey_stats,
        x="storey_band",
        y="median_ppsm",
        category_orders={"storey_band": STOREY_LABELS},
        hover_data={"transactions": ":,", "median_ppsm": ":$,.0f"},
        labels={"median_ppsm": "Median Price per sqm", "storey_band": "Storey Band"},
        height=380,
    )
    fig6.update_layout(yaxis_tickprefix="$", margin=dict(t=20, b=20))
    st.plotly_chart(fig6, width="stretch")

st.caption(
    "Higher-storey differences are descriptive associations. The dashboard "
    "does not estimate an isolated causal storey premium."
)

# ----------------------------------------------------------------------
# M. Million-dollar transaction share (compact, complete years only)
# ----------------------------------------------------------------------
st.markdown("---")
st.subheader("Million-Dollar Transaction Share")
st.caption("Share of transactions at or above $1,000,000, by complete year.")

mil_base = trend_base[trend_base["year"].isin(complete_years)]
if mil_base.empty:
    st.info("No data available for the million-dollar share chart under current filters.")
else:
    mil_yearly = mil_base.groupby("year").agg(
        transactions=("resale_price", "size"),
        million_dollar=("resale_price", lambda s: int((s >= 1_000_000).sum())),
    )
    mil_yearly["share_pct"] = mil_yearly["million_dollar"] / mil_yearly["transactions"] * 100
    mil_yearly = mil_yearly.reset_index()

    fig7 = px.bar(
        mil_yearly,
        x="year",
        y="share_pct",
        hover_data={"transactions": ":,", "million_dollar": ":,", "share_pct": ":.2f"},
        labels={"share_pct": "Million-Dollar Share (%)", "year": "Year"},
        height=320,
    )
    fig7.update_layout(xaxis=dict(dtick=1), margin=dict(t=20, b=20))
    st.plotly_chart(fig7, width="stretch")

# ----------------------------------------------------------------------
# N. Methodology & data notes
# ----------------------------------------------------------------------
st.markdown("---")
with st.expander("Methodology & Data Notes"):
    st.markdown(
        f"""
- **Source:** official [data.gov.sg](https://data.gov.sg) HDB resale flat prices dataset (2017 onwards).
- **Primary metric:** medians are used throughout, since resale price distributions are right-skewed.
- **Latest month ({latest_month:%Y-%m}) may be incomplete** and is excluded from every year-based comparison, though never removed from the underlying data.
- **Complete-year comparisons** require all 12 calendar months to be present for a year to count as "complete" — recomputed from the data on every load, never hardcoded.
- **Exact duplicate-looking rows are preserved.** The dataset has no transaction ID, so identical rows may represent genuine separate transactions. Duplicate sensitivity testing (in the underlying EDA) found negligible impact on headline medians.
- **Rare, extreme flat types** (e.g. very large "Terrace" flats) were retained rather than arbitrarily removed; medians are used specifically because they are robust to this kind of outlier.
- **Lease and storey relationships shown above are associations, not causal estimates.** Both are confounded with town, flat model, and flat age.
        """
    )
