"""
Builds a local DuckDB database from the cleaned HDB resale dataset.

Reads:  data/processed/hdb_resale_clean.csv (untouched)
Writes: data/processed/hdb_resale.duckdb (recreated each run; gitignored)

Also creates two small views used by every SQL query that needs complete-
year logic, so that logic is defined once, in the database, rather than
copy-pasted across query files:

- complete_years:       years with all 12 calendar months present
                        (latest-in-progress month excluded first)
- latest_complete_year: MAX(year) among complete_years

This never hardcodes a specific year — it is recomputed from the data
every time the database is built.
"""

import sys
from pathlib import Path

import duckdb
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PROCESSED_CSV = PROJECT_ROOT / "data" / "processed" / "hdb_resale_clean.csv"
DB_PATH = PROJECT_ROOT / "data" / "processed" / "hdb_resale.duckdb"

# The cleaning pipeline's expected output schema. This is a contract on the
# *shape* the cleaning pipeline promises to produce, not a fact about the
# size of the (live, rolling) dataset -- so it stays fixed, unlike row
# counts below, which are derived fresh from the current CSV each run.
EXPECTED_COLUMNS = [
    "month", "town", "flat_type", "block", "street_name", "storey_range",
    "floor_area_sqm", "flat_model", "lease_commence_date", "remaining_lease",
    "resale_price", "month_date", "year", "month_number",
    "remaining_lease_months", "remaining_lease_years",
    "storey_low", "storey_high", "storey_mid", "price_per_sqm",
    "is_exact_duplicate", "is_latest_month",
]

TRUE_VALUES = {"true", "1"}
FALSE_VALUES = {"false", "0"}

TYPE_EXPECTATIONS = {
    "month_date": lambda t: t == "DATE" or t.startswith("TIMESTAMP"),
    "year": lambda t: "INT" in t,
    "month_number": lambda t: "INT" in t,
    "resale_price": lambda t: t in ("DOUBLE", "FLOAT", "DECIMAL"),
    "floor_area_sqm": lambda t: t in ("DOUBLE", "FLOAT", "DECIMAL"),
    "remaining_lease_years": lambda t: t in ("DOUBLE", "FLOAT", "DECIMAL"),
    "price_per_sqm": lambda t: t in ("DOUBLE", "FLOAT", "DECIMAL"),
    "is_exact_duplicate": lambda t: t == "BOOLEAN",
    "is_latest_month": lambda t: t == "BOOLEAN",
}


def ensure_boolean_column(df: pd.DataFrame, col: str) -> pd.Series:
    """Return `col` as a genuine bool Series, without ever guessing.

    If pandas already parsed the column as bool (the normal case for this
    project's CSVs, where to_csv wrote literal True/False), it is returned
    unchanged. Otherwise the column is treated as text: every non-null
    value must be an unambiguous true/false representation (case-
    insensitively "true"/"false"/"1"/"0"). A blind `.astype(bool)` is
    deliberately avoided here, since a non-empty string like "False" is
    truthy in Python and would silently flip every False row to True.
    Any value outside the accepted set raises an error rather than being
    silently coerced one way or the other.
    """
    series = df[col]
    if pd.api.types.is_bool_dtype(series):
        return series

    text = series.astype(str).str.strip().str.lower()
    non_null_text = text[series.notna()]
    unexpected = sorted(set(non_null_text.unique()) - TRUE_VALUES - FALSE_VALUES)
    if unexpected:
        raise ValueError(
            f"Column '{col}' is not boolean-typed and contains values that "
            f"are not recognized true/false representations: {unexpected}. "
            f"Refusing to guess -- inspect the source CSV."
        )

    mapped = text.map(lambda v: True if v in TRUE_VALUES else (False if v in FALSE_VALUES else None))
    mapped[series.isna()] = None
    return mapped.astype("boolean")  # pandas nullable boolean dtype


def main() -> None:
    if not PROCESSED_CSV.exists():
        print(f"Processed CSV not found: {PROCESSED_CSV}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(PROCESSED_CSV, parse_dates=["month_date"])
    df["is_exact_duplicate"] = ensure_boolean_column(df, "is_exact_duplicate")
    df["is_latest_month"] = ensure_boolean_column(df, "is_latest_month")

    # Expected row counts are derived from THIS run's CSV, not hardcoded --
    # the source dataset is live/rolling, so a fixed row-count constant
    # would go stale on the next data pull. These checks instead confirm
    # that the DuckDB table faithfully reflects what pandas just read, not
    # that the dataset has some permanent fixed size.
    expected_row_count = len(df)
    expected_latest_month_rows = int(df["is_latest_month"].sum())

    if DB_PATH.exists():
        DB_PATH.unlink()

    con = duckdb.connect(str(DB_PATH))
    con.execute("CREATE TABLE hdb_resale AS SELECT * FROM df")

    # Complete-year logic, computed once from the data (see module docstring).
    con.execute("""
        CREATE OR REPLACE VIEW complete_years AS
        SELECT year
        FROM hdb_resale
        WHERE is_latest_month = FALSE
        GROUP BY year
        HAVING COUNT(DISTINCT month_number) = 12
    """)
    con.execute("""
        CREATE OR REPLACE VIEW latest_complete_year AS
        SELECT MAX(year) AS year FROM complete_years
    """)

    # ---- validation / reporting ----
    row_count = con.execute("SELECT COUNT(*) FROM hdb_resale").fetchone()[0]
    schema = con.execute("DESCRIBE hdb_resale").fetchall()  # (name, type, null, key, default, extra)
    col_count = len(schema)
    min_month, max_month = con.execute(
        "SELECT MIN(month_date), MAX(month_date) FROM hdb_resale"
    ).fetchone()
    latest_month_rows = con.execute(
        "SELECT COUNT(*) FROM hdb_resale WHERE is_latest_month = TRUE"
    ).fetchone()[0]
    latest_complete_year = con.execute("SELECT year FROM latest_complete_year").fetchone()[0]

    print("=" * 70)
    print("DUCKDB BUILD REPORT")
    print("=" * 70)
    print(f"Database path: {DB_PATH}")
    print(f"Row count: {row_count:,}")
    print(f"Column count: {col_count}")

    print("\nSchema:")
    for name, col_type, *_ in schema:
        print(f"  {name:<32} {col_type}")

    print(f"\nmonth_date range: {min_month} to {max_month}")
    print(f"is_latest_month rows: {latest_month_rows:,}")
    print(f"latest_complete_year (detected from data): {latest_complete_year}")

    print("\n--- Type checks ---")
    schema_types = {name: col_type for name, col_type, *_ in schema}
    all_types_ok = True
    for col, check in TYPE_EXPECTATIONS.items():
        actual = schema_types.get(col, "MISSING")
        ok = col in schema_types and check(actual)
        all_types_ok &= ok
        print(f"  {'PASS' if ok else 'FAIL'}  {col:<28} ({actual})")

    print("\n--- Schema contract check (cleaning pipeline's expected columns) ---")
    actual_columns = [name for name, *_ in schema]
    missing_columns = [c for c in EXPECTED_COLUMNS if c not in actual_columns]
    extra_columns = [c for c in actual_columns if c not in EXPECTED_COLUMNS]
    columns_ok = not missing_columns and not extra_columns
    print(f"  {'PASS' if columns_ok else 'FAIL'}  Expected {len(EXPECTED_COLUMNS)} columns, found {len(actual_columns)}")
    if missing_columns:
        print(f"    Missing: {missing_columns}")
    if extra_columns:
        print(f"    Unexpected extra: {extra_columns}")

    print("\n--- Row count checks (expected values derived from this run's CSV, not hardcoded) ---")
    checks = [
        ("Row count", row_count, expected_row_count),
        ("is_latest_month rows", latest_month_rows, expected_latest_month_rows),
    ]
    all_counts_ok = True
    for label, actual, expected in checks:
        ok = actual == expected
        all_counts_ok &= ok
        print(f"  {'PASS' if ok else 'FAIL'}  {label}: {actual:,} (CSV said {expected:,})")

    con.close()

    if not (all_types_ok and all_counts_ok and columns_ok):
        print("\nOne or more validation checks failed.", file=sys.stderr)
        sys.exit(1)

    print(f"\nDatabase built successfully: {DB_PATH}")


if __name__ == "__main__":
    main()
