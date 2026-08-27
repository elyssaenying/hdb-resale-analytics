import type { FilterState } from "@/lib/analytics/types";

export function parseFilters(
  searchParams: URLSearchParams,
  allTowns: string[],
  allFlatTypes: string[],
): FilterState {
  const townsParam = searchParams.getAll("town");
  const flatTypesParam = searchParams.getAll("flatType");
  const includePartial = searchParams.get("includePartial") === "true";
  const townsEmpty = searchParams.get("townsEmpty") === "true";
  const flatTypesEmpty = searchParams.get("flatTypesEmpty") === "true";

  return {
    towns: townsEmpty
      ? []
      : townsParam.length > 0
        ? townsParam.filter((town) => allTowns.includes(town))
        : allTowns,
    flatTypes: flatTypesEmpty
      ? []
      : flatTypesParam.length > 0
        ? flatTypesParam.filter((flatType) => allFlatTypes.includes(flatType))
        : allFlatTypes,
    includePartial,
  };
}
