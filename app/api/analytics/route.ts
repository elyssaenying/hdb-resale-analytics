import { NextRequest, NextResponse } from "next/server";
import { buildAnalyticsResponse } from "@/lib/analytics/build-response";
import type { FilterState } from "@/lib/analytics/types";
import { loadDataset } from "@/lib/data/loader";

export const dynamic = "force-dynamic";

function parseFilters(searchParams: URLSearchParams, allTowns: string[], allFlatTypes: string[]): FilterState {
  const townsParam = searchParams.getAll("town");
  const flatTypesParam = searchParams.getAll("flatType");
  const includePartial = searchParams.get("includePartial") === "true";

  return {
    towns: townsParam.length > 0 ? townsParam.filter((t) => allTowns.includes(t)) : allTowns,
    flatTypes: flatTypesParam.length > 0 ? flatTypesParam.filter((t) => allFlatTypes.includes(t)) : allFlatTypes,
    includePartial,
  };
}

export async function GET(request: NextRequest) {
  let dataset;
  try {
    dataset = loadDataset();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dataset." },
      { status: 500 },
    );
  }

  const filters = parseFilters(request.nextUrl.searchParams, dataset.towns, dataset.flatTypes);
  const response = buildAnalyticsResponse(dataset, filters);
  return NextResponse.json(response);
}
