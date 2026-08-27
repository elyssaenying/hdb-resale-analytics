import { businessContext } from "@/lib/config";

/**
 * Compact business-problem framing, directly under the masthead. Not a
 * second hero -- no motion, no large type, just enough editorial context
 * that the project's purpose and audience are legible within seconds.
 */
export function BusinessContext() {
  return (
    <section aria-labelledby="business-context-heading" className="border-b border-border bg-surface">
      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6">
        <h2 id="business-context-heading" className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          The Decision Problem
        </h2>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="max-w-3xl text-balance text-base leading-relaxed text-ink sm:text-lg">
              {businessContext.problem}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">{businessContext.framing}</p>
          </div>
          <div className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">Primary audience</p>
            <p className="mt-1 text-sm text-ink">{businessContext.primaryAudience}</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-ink-muted">Also relevant to</p>
            <ul className="mt-1 space-y-1">
              {businessContext.secondaryAudiences.map((audience) => (
                <li key={audience} className="text-sm text-ink-muted">
                  {audience}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
