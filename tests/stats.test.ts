import { describe, expect, it } from "vitest";
import { median, percentChange } from "@/lib/analytics/stats";

describe("median", () => {
  it("returns null for an empty array", () => {
    expect(median([])).toBeNull();
  });

  it("returns the middle value for an odd-length array", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("averages the two middle values for an even-length array", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("handles a single value", () => {
    expect(median([42])).toBe(42);
  });

  it("does not mutate the input array", () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });
});

describe("percentChange", () => {
  it("computes a positive change", () => {
    expect(percentChange(150, 100)).toBe(50);
  });

  it("computes a negative change", () => {
    expect(percentChange(50, 100)).toBe(-50);
  });

  it("returns null when the base is zero", () => {
    expect(percentChange(10, 0)).toBeNull();
  });

  it("returns null when either input is null", () => {
    expect(percentChange(null, 100)).toBeNull();
    expect(percentChange(100, null)).toBeNull();
  });
});
