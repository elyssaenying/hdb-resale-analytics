"use client";

import { datasetLimitations, futureExtensions, methodologyReferences } from "@/lib/config";

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
        <div>
          <ul className="space-y-2.5 text-sm leading-relaxed text-ink-muted">
            {NOTES.map((note) => (
              <li key={note} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                <span>{note}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-sm font-semibold text-ink">What this dataset cannot tell you</h3>
          <p className="mt-1.5 text-sm text-ink-muted">
            The transaction records do not include:
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {datasetLimitations.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-ink-muted">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-muted">
            As a result, this analysis can describe <em>what</em> happened in the resale market, but cannot on
            its own explain <em>why</em>, measure affordability, or substitute for professional valuation or
            financial advice.
          </p>

          <h3 className="mt-6 text-sm font-semibold text-ink">Possible future extensions</h3>
          <p className="mt-1.5 text-sm text-ink-muted">
            {futureExtensions.join(", ")}. Each would require additional data and, in most cases, additional
            methodology beyond what is implemented here — none of this is claimed to be necessary to make the
            current analysis complete.
          </p>
        </div>

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
