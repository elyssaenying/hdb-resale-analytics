import fs from "node:fs";
import path from "node:path";
import type { Dataset, Row } from "@/lib/analytics/types";

const EXPORT_PATH = path.join(process.cwd(), "data", "processed", "web_export.json");

interface RawExport {
  generatedAt: string;
  sourceRowCount: number;
  towns: string[];
  flatTypes: string[];
  columns: string[];
  data: {
    town: number[];
    flatType: number[];
    year: number[];
    monthNumber: number[];
    isLatestMonth: number[];
    resalePrice: number[];
    floorAreaSqm: number[];
    pricePerSqm: number[];
    remainingLeaseYears: number[];
    storeyMid: number[];
  };
}

function at<T>(arr: T[], index: number): T {
  const value = arr[index];
  if (value === undefined) {
    throw new Error(`Web data artifact is malformed: index ${index} out of bounds.`);
  }
  return value;
}

let cached: Dataset | null = null;

/**
 * Loads and decodes the compact web export artifact into row objects,
 * caching the result in module scope for the life of the server process
 * (analogous to Streamlit's @st.cache_data in app.py).
 *
 * This is the one place the on-disk artifact format is known -- if the
 * export format changes, only this function needs to change.
 */
export function loadDataset(): Dataset {
  if (cached) return cached;

  if (!fs.existsSync(EXPORT_PATH)) {
    throw new Error(
      `Web data artifact not found at ${EXPORT_PATH}. ` +
        `Run: python3 scripts/export_dashboard_data.py`,
    );
  }

  const raw = JSON.parse(fs.readFileSync(EXPORT_PATH, "utf-8")) as RawExport;
  const n = raw.data.year.length;
  const rows: Row[] = new Array(n);

  for (let i = 0; i < n; i++) {
    rows[i] = {
      town: at(raw.towns, at(raw.data.town, i)),
      flatType: at(raw.flatTypes, at(raw.data.flatType, i)),
      year: at(raw.data.year, i),
      monthNumber: at(raw.data.monthNumber, i),
      isLatestMonth: at(raw.data.isLatestMonth, i) === 1,
      resalePrice: at(raw.data.resalePrice, i),
      floorAreaSqm: at(raw.data.floorAreaSqm, i),
      pricePerSqm: at(raw.data.pricePerSqm, i),
      remainingLeaseYears: at(raw.data.remainingLeaseYears, i),
      storeyMid: at(raw.data.storeyMid, i),
    };
  }

  cached = {
    towns: raw.towns,
    flatTypes: raw.flatTypes,
    rows,
    generatedAt: raw.generatedAt,
  };
  return cached;
}
