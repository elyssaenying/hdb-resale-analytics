"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalyticsResponse } from "@/lib/analytics/build-response";
import type { FilterState } from "@/lib/analytics/types";

function buildQuery(filters: FilterState, allTowns: string[], allFlatTypes: string[]): string {
  const params = new URLSearchParams();
  const allTownsSelected = filters.towns.length === allTowns.length;
  const allTypesSelected = filters.flatTypes.length === allFlatTypes.length;

  if (!allTownsSelected) {
    for (const t of filters.towns) params.append("town", t);
  }
  if (!allTypesSelected) {
    for (const t of filters.flatTypes) params.append("flatType", t);
  }
  if (filters.includePartial) params.set("includePartial", "true");

  return params.toString();
}

/**
 * Fetches filtered analytics data from /api/analytics whenever the
 * filter state changes. The initial render uses server-computed data
 * (passed in as initialData) so the default view never shows a loading
 * flash -- only subsequent filter changes trigger a client fetch.
 */
export function useAnalyticsData(
  filters: FilterState,
  allTowns: string[],
  allFlatTypes: string[],
  initialData: AnalyticsResponse,
) {
  const [data, setData] = useState<AnalyticsResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);
  const queryKey = `${filters.towns.join(",")}|${filters.flatTypes.join(",")}|${filters.includePartial}`;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const query = buildQuery(filters, allTowns, allFlatTypes);

    fetch(`/api/analytics${query ? `?${query}` : ""}`, { signal: controller.signal })
      .then((res) => res.json() as Promise<AnalyticsResponse>)
      .then((json) => setData(json))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to fetch analytics data", err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  return { data, loading };
}
