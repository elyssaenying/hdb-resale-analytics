"""
Cleans the raw HDB resale flat prices dataset into an analysis-ready file.

Reads:  data/raw/resale_flat_prices_2017_onwards.csv (untouched)
Writes: data/processed/hdb_resale_clean.csv

All original raw columns are preserved unchanged. Cleaning adds new derived
columns rather than overwriting raw values. See docs/data_cleaning.md for
the full rationale behind each transformation.
"""

import re
import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = PROJECT_ROOT / "data" / "raw" / "resale_flat_prices_2017_onwards.csv"
PROCESSED_PATH = PROJECT_ROOT / "data" / "processed" / "hdb_resale_clean.csv"

RAW_COLUMNS = [
    "month",
    "town",
    "flat_type",
    "block",
    "street_name",
    "storey_range",
    "floor_area_sqm",
    "flat_model",
    "lease_commence_date",
    "remaining_lease",
    "resale_price",
]

LEASE_PATTERN = re.compile(
    r"^\s*(?P<years>\d+)\s+years?\s*(?:(?P<months>\d+)\s+months?)?\s*$",
    re.IGNORECASE,
)
STOREY_PATTERN = re.compile(r"^\s*(\d+)\s+TO\s+(\d+)\s*$", re.IGNORECASE)


def parse_remaining_lease(value):
    """Parse strings like '61 years 04 months', '63 years', '1 year 1 month'.

    Returns (months, years) as (int, float), or (None, None) if the value
    cannot be parsed. Never silently defaults to 0.
    """
    if pd.isna(value):
        return None, None

    match = LEASE_PATTERN.match(str(value))
    if not match:
        return None, None

    years = int(match.group("years"))
    months = int(match.group("months")) if match.group("months") else 0
    total_months = years * 12 + months
    return total_months, round(total_months / 12, 2)


def parse_storey_range(value):
    """Parse strings like '10 TO 12' into (low, high, mid)."""
    if pd.isna(value):
        return None, None, None

    match = STOREY_PATTERN.match(str(value))
    if not match:
        return None, None, None

    low, high = int(match.group(1)), int(match.group(2))
    mid = (low + high) / 2
    return low, high, mid


def main() -> None:
    if not RAW_PATH.exists():
        print(f"Raw file not found: {RAW_PATH}", file=sys.stderr)
        sys.exit(1)

    raw_df = pd.read_csv(RAW_PATH)
    raw_row_count = len(raw_df)
    raw_col_count = len(raw_df.columns)

    df = raw_df.copy()

    # --- month -> datetime (first day of month), year, month_number ---
    df["month_date"] = pd.to_datetime(df["month"], format="%Y-%m")
    df["year"] = df["month_date"].dt.year
    df["month_number"] = df["month_date"].dt.month

    # --- remaining_lease parsing ---
    parsed_lease = df["remaining_lease"].apply(parse_remaining_lease)
    df["remaining_lease_months"] = parsed_lease.apply(lambda t: t[0]).astype("Int64")
    df["remaining_lease_years"] = parsed_lease.apply(lambda t: t[1])

    lease_parse_failures = df[
        df["remaining_lease"].notna() & df["remaining_lease_months"].isna()
    ]

    # --- storey_range parsing ---
    parsed_storey = df["storey_range"].apply(parse_storey_range)
    df["storey_low"] = parsed_storey.apply(lambda t: t[0]).astype("Int64")
    df["storey_high"] = parsed_storey.apply(lambda t: t[1]).astype("Int64")
    df["storey_mid"] = parsed_storey.apply(lambda t: t[2])

    storey_parse_failures = df[
        df["storey_range"].notna() & df["storey_low"].isna()
    ]

    # --- numeric coercion (report, don't silently fix) ---
    floor_area_before_na = df["floor_area_sqm"].isna().sum()
    price_before_na = df["resale_price"].isna().sum()
    df["floor_area_sqm"] = pd.to_numeric(df["floor_area_sqm"], errors="coerce")
    df["resale_price"] = pd.to_numeric(df["resale_price"], errors="coerce")
    floor_area_new_na = df["floor_area_sqm"].isna().sum() - floor_area_before_na
    price_new_na = df["resale_price"].isna().sum() - price_before_na

    # --- price_per_sqm (guard against division by zero/negative area) ---
    safe_floor_area = df["floor_area_sqm"].where(df["floor_area_sqm"] > 0)
    df["price_per_sqm"] = df["resale_price"] / safe_floor_area

    # --- exact duplicate flag (based on raw columns only, not derived ones) ---
    df["is_exact_duplicate"] = df.duplicated(subset=RAW_COLUMNS, keep=False)

    # --- latest month flag ---
    max_month = df["month_date"].max()
    df["is_latest_month"] = df["month_date"] == max_month

    # --- validity checks (report only, no rows removed) ---
    invalid_floor_area = df[df["floor_area_sqm"] <= 0]
    invalid_price = df[df["resale_price"] <= 0]
    invalid_lease_months = df[
        df["remaining_lease_months"].notna() & (df["remaining_lease_months"] <= 0)
    ]
    current_year = pd.Timestamp.today().year
    implausible_lease_commence = df[
        (df["lease_commence_date"] < 1960) | (df["lease_commence_date"] > current_year)
    ]
    invalid_storey = df[
        df["storey_low"].notna() & (df["storey_low"] > df["storey_high"])
    ]

    expected_new_na_cols = {
        "remaining_lease_months": int(lease_parse_failures.shape[0]),
        "storey_low": int(storey_parse_failures.shape[0]),
    }
    unexpected_missing = {}
    for col in df.columns:
        if col in RAW_COLUMNS:
            na_count = int(df[col].isna().sum())
            if na_count > 0:
                unexpected_missing[col] = na_count

    # --- save processed dataset ---
    PROCESSED_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(PROCESSED_PATH, index=False)

    # ================= VALIDATION REPORT =================
    print("=" * 70)
    print("CLEANING VALIDATION REPORT")
    print("=" * 70)

    print(f"\nRaw row count:        {raw_row_count:,}")
    print(f"Processed row count:  {len(df):,}")
    print(f"Raw column count:     {raw_col_count}")
    print(f"Processed column count: {len(df.columns)}")

    print("\n--- Missing values (raw columns, post-cleaning) ---")
    if unexpected_missing:
        for col, count in unexpected_missing.items():
            print(f"  {col}: {count} missing")
    else:
        print("  None (no missing values in any original raw column)")

    print("\n--- Parsing failures ---")
    print(f"  remaining_lease unparseable: {len(lease_parse_failures)}")
    if len(lease_parse_failures) > 0:
        print(lease_parse_failures[["remaining_lease"]].head(10).to_string())
    print(f"  storey_range unparseable: {len(storey_parse_failures)}")
    if len(storey_parse_failures) > 0:
        print(storey_parse_failures[["storey_range"]].head(10).to_string())
    print(f"  floor_area_sqm newly non-numeric: {floor_area_new_na}")
    print(f"  resale_price newly non-numeric: {price_new_na}")

    print("\n--- Exact duplicate rows ---")
    dup_count = int(df["is_exact_duplicate"].sum())
    dup_groups = df[df["is_exact_duplicate"]].groupby(RAW_COLUMNS).ngroups
    print(f"  Rows flagged is_exact_duplicate=True: {dup_count}")
    print(f"  Distinct duplicate groups: {dup_groups}")
    print("  Policy: NOT removed. Flagged only (see docs/data_cleaning.md).")

    print("\n--- Latest month flag ---")
    print(f"  Latest month: {max_month.strftime('%Y-%m')}")
    print(f"  Rows flagged is_latest_month=True: {int(df['is_latest_month'].sum())}")

    print("\n--- Date range ---")
    print(f"  {df['month_date'].min().strftime('%Y-%m')} to {df['month_date'].max().strftime('%Y-%m')}")

    print("\n--- Price range ---")
    print(f"  min: {df['resale_price'].min():,.0f}  max: {df['resale_price'].max():,.0f}")

    print("\n--- Floor area range (sqm) ---")
    print(f"  min: {df['floor_area_sqm'].min()}  max: {df['floor_area_sqm'].max()}")

    print("\n--- Remaining lease range ---")
    print(
        f"  min: {df['remaining_lease_years'].min()} years  "
        f"max: {df['remaining_lease_years'].max()} years"
    )

    print("\n--- Validity checks (reported, not auto-removed) ---")
    print(f"  floor_area_sqm <= 0: {len(invalid_floor_area)}")
    print(f"  resale_price <= 0: {len(invalid_price)}")
    print(f"  remaining_lease_months <= 0: {len(invalid_lease_months)}")
    print(f"  lease_commence_date outside [1960, {current_year}]: {len(implausible_lease_commence)}")
    print(f"  storey_low > storey_high: {len(invalid_storey)}")

    print("\n--- Sample cleaned rows ---")
    sample_cols = [
        "month_date", "year", "month_number", "town", "flat_type",
        "storey_low", "storey_high", "storey_mid",
        "remaining_lease_months", "remaining_lease_years",
        "floor_area_sqm", "resale_price", "price_per_sqm",
        "is_exact_duplicate", "is_latest_month",
    ]
    print(df[sample_cols].head(5).to_string())

    print(f"\nSaved cleaned dataset to: {PROCESSED_PATH}")


if __name__ == "__main__":
    main()
