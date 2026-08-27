/**
 * Pure statistical helpers. No dependency on the dataset shape, so these
 * are independently unit-testable.
 */

/** Matches pandas/numpy default median: average of the two middle values
 * for an even-length array, exact middle value for odd length. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const a = sorted[mid - 1];
    const b = sorted[mid];
    if (a === undefined || b === undefined) return null;
    return (a + b) / 2;
  }

  const v = sorted[mid];
  return v === undefined ? null : v;
}

export function percentChange(current: number | null, base: number | null): number | null {
  if (current === null || base === null || base === 0) return null;
  return ((current - base) / base) * 100;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Groups items by a key function into a Map, preserving insertion order
 * of first-seen keys. */
export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}
