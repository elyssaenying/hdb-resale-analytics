/**
 * Lease and storey band definitions, ported exactly from app.py:
 *
 *   LEASE_BINS = [0, 50, 60, 70, 80, 90, 200]
 *   LEASE_LABELS = ["<50", "50-59", "60-69", "70-79", "80-89", "90+"]
 *   pd.cut(..., bins=LEASE_BINS, labels=LEASE_LABELS, right=False)
 *   -> intervals are [a, b): a <= x < b
 *
 *   STOREY_BINS = [0, 6, 15, 200]
 *   STOREY_LABELS = ["Low (1-6)", "Mid (7-15)", "High (16+)"]
 *   pd.cut(..., bins=STOREY_BINS, right=True)
 *   -> intervals are (a, b]: a < x <= b
 */

export const LEASE_BANDS = ["<50", "50-59", "60-69", "70-79", "80-89", "90+"] as const;
export type LeaseBand = (typeof LEASE_BANDS)[number];

export function leaseBandFor(years: number): LeaseBand {
  if (years < 50) return "<50";
  if (years < 60) return "50-59";
  if (years < 70) return "60-69";
  if (years < 80) return "70-79";
  if (years < 90) return "80-89";
  return "90+";
}

export const STOREY_BANDS = ["Low (1-6)", "Mid (7-15)", "High (16+)"] as const;
export type StoreyBand = (typeof STOREY_BANDS)[number];

export function storeyBandFor(mid: number): StoreyBand {
  if (mid <= 6) return "Low (1-6)";
  if (mid <= 15) return "Mid (7-15)";
  return "High (16+)";
}
