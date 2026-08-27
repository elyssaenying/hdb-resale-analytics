import { NextRequest, NextResponse } from "next/server";
import { buildAnalyticsResponse } from "@/lib/analytics/build-response";
import { parseFilters } from "@/lib/analytics/parse-filters";
import { loadDataset } from "@/lib/data/loader";

export const dynamic = "force-dynamic";

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
