"""
Runs every SQL query file in sql/queries/ against the DuckDB database and
prints the results.

The .sql files are the sole source of truth for the analytical SQL — this
script only reads, splits, executes, and prints. No query logic is
duplicated here.
"""

import re
import sys
from pathlib import Path

import duckdb

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "data" / "processed" / "hdb_resale.duckdb"
QUERIES_DIR = PROJECT_ROOT / "sql" / "queries"

TITLE_PATTERN = re.compile(r"--\s*@title:\s*(.+)")


def split_statements(sql_text: str) -> list[tuple[str, str]]:
    """Split a .sql file into (title, statement) pairs on ';' boundaries.

    Each statement is expected to be preceded by a `-- @title: ...` comment
    line; if absent, a generic placeholder title is used.

    Titles are extracted from the original text first, then all comments
    are stripped before splitting on ';' — otherwise a ';' appearing inside
    an ordinary descriptive comment (not a statement terminator) would be
    mistaken for one.
    """
    titles = TITLE_PATTERN.findall(sql_text)

    code_lines = []
    for line in sql_text.splitlines():
        code_lines.append(line.split("--", 1)[0] if "--" in line else line)
    code_only = "\n".join(code_lines)

    raw_statements = [s.strip() for s in code_only.split(";") if s.strip()]

    results = []
    for i, statement in enumerate(raw_statements):
        title = titles[i] if i < len(titles) else "(untitled query)"
        results.append((title, statement))
    return results


def main() -> None:
    if not DB_PATH.exists():
        print(
            f"Database not found: {DB_PATH}\n"
            f"Run scripts/build_database.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    query_files = sorted(QUERIES_DIR.glob("*.sql"))
    if not query_files:
        print(f"No .sql files found in {QUERIES_DIR}", file=sys.stderr)
        sys.exit(1)

    con = duckdb.connect(str(DB_PATH), read_only=True)

    for query_file in query_files:
        sql_text = query_file.read_text()
        statements = split_statements(sql_text)

        for title, statement in statements:
            heading = f"{query_file.name} — {title}"
            print("\n" + "=" * 70)
            print(heading)
            print("=" * 70)

            try:
                result_df = con.execute(statement).fetchdf()
            except Exception as exc:
                print(f"\nQUERY FAILED: {query_file.name}", file=sys.stderr)
                print(f"Title: {title}", file=sys.stderr)
                print(f"Error: {exc}", file=sys.stderr)
                con.close()
                sys.exit(1)

            print(result_df.to_string(index=False))

    con.close()
    print("\nAll SQL queries executed successfully.")


if __name__ == "__main__":
    main()
