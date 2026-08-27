import { stakeholderUseCases } from "@/lib/config";

export function BusinessApplications() {
  return (
    <section aria-labelledby="applications-heading" className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6">
      <h2 id="applications-heading" className="text-lg font-semibold text-ink sm:text-xl">
        From Analysis to Decision
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        How this evidence could support decisions for different stakeholders — and what it deliberately
        cannot tell them.
      </p>

      <div className="mt-6 divide-y divide-border border-t border-border">
        {stakeholderUseCases.map((useCase) => (
          <div key={useCase.stakeholder} className="grid gap-1 py-4 sm:grid-cols-[220px_1fr]">
            <p className="text-sm font-medium text-ink">{useCase.stakeholder}</p>
            <div className="space-y-1.5">
              <p className="text-sm text-ink">
                <span className="text-ink-muted">Could support: </span>
                {useCase.decision}
              </p>
              <p className="text-sm text-ink-muted">
                <span className="text-ink-muted">Evidence used: </span>
                {useCase.evidence}
              </p>
              <p className="text-sm text-signal">
                <span className="text-ink-muted">Limitation: </span>
                {useCase.limitation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
