"""
Downloads the "Resale flat prices based on registration date from Jan-2017
onwards" dataset from data.gov.sg and saves it, untouched, to data/raw/.

Uses the data.gov.sg Dataset Download API:
https://guide.data.gov.sg/developer-guide/dataset-apis/download-dataset
"""

import sys
import time
from pathlib import Path

import pandas as pd
import requests

DATASET_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc"
BASE_URL = "https://api-open.data.gov.sg/v1/public/api/datasets"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"
OUTPUT_PATH = RAW_DIR / "resale_flat_prices_2017_onwards.csv"

POLL_INTERVAL_SECONDS = 3
MAX_POLL_ATTEMPTS = 10


def get_download_url() -> str:
    """Initiate the download job and poll until the file is ready."""
    initiate_resp = requests.get(
        f"{BASE_URL}/{DATASET_ID}/initiate-download",
        json={},
        timeout=30,
    )
    initiate_resp.raise_for_status()

    for attempt in range(1, MAX_POLL_ATTEMPTS + 1):
        poll_resp = requests.get(
            f"{BASE_URL}/{DATASET_ID}/poll-download",
            json={},
            timeout=30,
        )
        poll_resp.raise_for_status()
        payload = poll_resp.json()["data"]

        if payload.get("status") == "DOWNLOAD_SUCCESS" and payload.get("url"):
            return payload["url"]

        print(f"  Poll attempt {attempt}/{MAX_POLL_ATTEMPTS}: not ready yet, waiting...")
        time.sleep(POLL_INTERVAL_SECONDS)

    raise RuntimeError("Download did not become ready in time.")


def download_csv(url: str, destination: Path) -> None:
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(response.content)


def validate(csv_path: Path) -> None:
    """Print basic, non-destructive validation info about the raw file."""
    df = pd.read_csv(csv_path)

    print("\n--- Validation Report ---")
    print(f"Row count: {len(df):,}")
    print(f"Column names: {list(df.columns)}")

    print("\nFirst 5 rows:")
    print(df.head())

    if "month" in df.columns:
        print(f"\nDate range (month): {df['month'].min()} to {df['month'].max()}")

    print("\nMissing values per column:")
    print(df.isna().sum())

    print(f"\nDuplicate rows: {df.duplicated().sum():,}")


def main() -> None:
    print(f"Requesting download link for dataset {DATASET_ID}...")
    download_url = get_download_url()

    print(f"Downloading to {OUTPUT_PATH}...")
    download_csv(download_url, OUTPUT_PATH)
    print("Download complete.")

    validate(OUTPUT_PATH)


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as exc:
        print(f"HTTP error while contacting data.gov.sg: {exc}", file=sys.stderr)
        sys.exit(1)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
