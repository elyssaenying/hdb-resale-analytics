"""
Exports a compact, row-level JSON artifact for the Next.js website from
the already-cleaned dataset.

Reads:  data/processed/hdb_resale_clean.csv (untouched)
Writes: data/processed/web_export.json (gitignored; regenerate on demand)

Why row-level, not pre-aggregated:
A median of subgroup medians is not the combined median. Because the
website's filters (town multiselect, flat-type multiselect) allow
arbitrary combinations, only row-level data lets the server recompute an
exact median for any combination the user selects -- pre-aggregating by
town or flat_type alone would make arbitrary multiselect medians
mathematically wrong.

Why this is still "compact" rather than just copying the CSV:
Only the 10 fields the dashboard actually uses are kept (verified against
app.py's filters/charts -- block, street_name, storey_range, flat_model,
lease_commence_date, remaining_lease text, month text, month_date,
remaining_lease_months, storey_low/high, and is_exact_duplicate are never
read by app.py). town/flat_type are stored as small integer indices into
a lookup table instead of repeating the strings ~239,000 times each.

This script is deterministic: given the same input CSV, it always
produces the same output. It does not hardcode any particular year's
results -- entirely derived from whatever the input CSV contains.
"""

import json
import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PROCESSED_CSV = PROJECT_ROOT / "data" / "processed" / "hdb_resale_clean.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "web_export.json"


def main() -> None:
    if not PROCESSED_CSV.exists():
        print(f"Processed CSV not found: {PROCESSED_CSV}", file=sys.stderr)
        print("Run scripts/clean_data.py first.", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(
        PROCESSED_CSV,
        usecols=[
            "town",
            "flat_type",
            "year",
            "month_number",
            "is_latest_month",
            "resale_price",
            "floor_area_sqm",
            "price_per_sqm",
            "remaining_lease_years",
            "storey_mid",
        ],
    )

    towns = sorted(df["town"].unique().tolist())
    flat_types = sorted(df["flat_type"].unique().tolist())
    town_index = {name: i for i, name in enumerate(towns)}
    flat_type_index = {name: i for i, name in enumerate(flat_types)}

    payload = {
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "sourceRowCount": len(df),
        "towns": towns,
        "flatTypes": flat_types,
        "columns": [
            "town",
            "flatType",
            "year",
            "monthNumber",
            "isLatestMonth",
            "resalePrice",
            "floorAreaSqm",
            "pricePerSqm",
            "remainingLeaseYears",
            "storeyMid",
        ],
        "data": {
            "town": df["town"].map(town_index).astype(int).tolist(),
            "flatType": df["flat_type"].map(flat_type_index).astype(int).tolist(),
            "year": df["year"].astype(int).tolist(),
            "monthNumber": df["month_number"].astype(int).tolist(),
            "isLatestMonth": df["is_latest_month"].astype(int).tolist(),
            "resalePrice": df["resale_price"].astype(float).tolist(),
            "floorAreaSqm": df["floor_area_sqm"].astype(float).tolist(),
            "pricePerSqm": df["price_per_sqm"].astype(float).tolist(),
            "remainingLeaseYears": df["remaining_lease_years"].astype(float).tolist(),
            "storeyMid": df["storey_mid"].astype(float).tolist(),
        },
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w") as f:
        json.dump(payload, f, separators=(",", ":"))

    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"Wrote {OUTPUT_PATH} ({size_mb:.1f} MB, {len(df):,} rows, "
          f"{len(towns)} towns, {len(flat_types)} flat types).")


if __name__ == "__main__":
    main()
