"use client";

import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { Toggle } from "@/components/ui/toggle";
import type { FilterState } from "@/lib/analytics/types";

interface FilterBarProps {
  allTowns: string[];
  allFlatTypes: string[];
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}

function countActiveFilters(filters: FilterState, allTowns: string[], allFlatTypes: string[]): number {
  let count = 0;
  if (filters.towns.length !== allTowns.length) count += 1;
  if (filters.flatTypes.length !== allFlatTypes.length) count += 1;
  if (filters.includePartial) count += 1;
  return count;
}

export function FilterBar({ allTowns, allFlatTypes, filters, onChange, onReset }: FilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = countActiveFilters(filters, allTowns, allFlatTypes);

  const controls = (
    <>
      <MultiSelect
        label="Town"
        options={allTowns}
        selected={filters.towns}
        onChange={(towns) => onChange({ ...filters, towns })}
      />
      <MultiSelect
        label="Flat Type"
        options={allFlatTypes}
        selected={filters.flatTypes}
        onChange={(flatTypes) => onChange({ ...filters, flatTypes })}
      />
      <Toggle
        checked={filters.includePartial}
        onChange={(includePartial) => onChange({ ...filters, includePartial })}
        label="Include partial-year data"
        description="Adds current-year YTD"
      />
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Reset
      </button>
    </>
  );

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 sm:px-6">
        <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted md:flex">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Filters
        </span>

        <div className="hidden flex-1 flex-wrap items-center gap-2.5 md:flex">{controls}</div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink md:hidden"
          aria-haspopup="dialog"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-ink">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-ink/30"
            aria-label="Close filters"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-border bg-surface p-4 shadow-[0_-4px_16px_rgba(20,18,15,0.12)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Filters</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="rounded p-1 text-ink-muted hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-col items-stretch gap-3">{controls}</div>
          </div>
        </div>
      )}
    </div>
  );
}
