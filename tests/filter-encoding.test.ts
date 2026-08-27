import { describe, expect, it } from "vitest";
import { parseFilters } from "@/lib/analytics/parse-filters";

/**
 * Regression test for a real bug found during Stage 7 browser validation:
 * zero `town` query params was ambiguous between "no filter, use all" and
 * "the user explicitly selected nothing" -- both produced the same query
 * string, so an explicitly empty town selection silently fell back to
 * "all towns" instead of showing the empty-filter state. Fixed with an
 * explicit `townsEmpty`/`flatTypesEmpty` marker.
 */
describe("parseFilters", () => {
  const allTowns = ["ANG MO KIO", "BEDOK", "BUKIT TIMAH"];
  const allFlatTypes = ["3 ROOM", "4 ROOM", "5 ROOM"];

  it("defaults to all towns/flat types when no params are present", () => {
    const result = parseFilters(new URLSearchParams(""), allTowns, allFlatTypes);
    expect(result.towns).toEqual(allTowns);
    expect(result.flatTypes).toEqual(allFlatTypes);
  });

  it("respects an explicit subset of towns", () => {
    const params = new URLSearchParams();
    params.append("town", "BEDOK");
    const result = parseFilters(params, allTowns, allFlatTypes);
    expect(result.towns).toEqual(["BEDOK"]);
  });

  it("treats an explicit empty-towns marker as zero towns, not all towns", () => {
    const params = new URLSearchParams();
    params.set("townsEmpty", "true");
    const result = parseFilters(params, allTowns, allFlatTypes);
    expect(result.towns).toEqual([]);
  });

  it("treats an explicit empty-flat-types marker as zero flat types, not all", () => {
    const params = new URLSearchParams();
    params.set("flatTypesEmpty", "true");
    const result = parseFilters(params, allTowns, allFlatTypes);
    expect(result.flatTypes).toEqual([]);
  });
});
