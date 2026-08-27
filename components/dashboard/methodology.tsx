"use client";

import { methodologyReferences } from "@/lib/config";

const NOTES = [
  "Source: official data.gov.sg HDB resale flat prices dataset (2017 onward), acquired via the data.gov.sg API.",
  "Raw and processed data are kept separate; the processed dataset adds derived columns without altering the originals.",
  "Medians are used throughout, not means, because resale prices are right-skewed.",
  "A year only counts as \"complete\" once all 12 calendar months are present; the latest month is excluded from every full-year comparison.",
  "Exact duplicate-looking rows are preserved, since the dataset has no transaction ID to distinguish genuine repeat sales from export duplicates.",
  "Duplicate sensitivity testing found negligible impact on headline medians (well under 1%).",
  "Rare, extreme flat types (e.g. very large \"Terrace\" units) were retained rather than arbitrarily removed.",
  "Lease and storey relationships are reported as associations, not causal estimates.",
  "Findings were independently cross-validated between a Python/pandas EDA and DuckDB SQL analysis.",
];

export function Methodology() {
  return (
    <section aria-labelledby="methodology-heading" className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6">
      <h2 id="methodology-heading" className="text-lg font-semibold text-ink sm:text-xl">
        Methodology &amp; Data Notes
      </h2>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_260px]">
        <ul className="space-y-2.5 text-sm leading-relaxed text-ink-muted">
          {NOTES.map((note) => (
            <li key={note} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
        <div className="h-fit rounded-md border border-border bg-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">References</p>
          <ul className="mt-2 space-y-1.5">
            {methodologyReferences.map((ref) => (
              <li key={ref.path} className="font-mono text-xs text-ink">
                {ref.label}
                <span className="block text-ink-muted">{ref.path}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
