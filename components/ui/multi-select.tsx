"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const allSelected = selected.length === options.length && options.length > 0;
  const summary = allSelected
    ? `All (${options.length})`
    : selected.length === 0
      ? "None"
      : `${selected.length} of ${options.length}`;

  function toggleOption(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-ink-muted"
      >
        <span className="text-ink-muted">{label}</span>
        <span className="tabular-nums font-medium">{summary}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute z-30 mt-1.5 max-h-72 w-64 overflow-auto rounded-md border border-border bg-surface p-1 shadow-[0_2px_8px_rgba(20,18,15,0.08)]"
        >
          <div className="flex items-center justify-between border-b border-border px-2 py-1.5 text-xs text-ink-muted">
            <button type="button" className="hover:text-ink" onClick={() => onChange(options)}>
              Select all
            </button>
            <button type="button" className="hover:text-ink" onClick={() => onChange([])}>
              Clear
            </button>
          </div>
          <div className="py-1">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <label
                  key={option}
                  role="option"
                  aria-selected={isSelected}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-canvas"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOption(option)}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
