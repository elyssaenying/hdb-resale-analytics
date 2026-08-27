/**
 * Site-level configuration. Deliberately does not fabricate a GitHub URL,
 * personal name, or contact information -- none of those exist in the
 * repository yet. Fill in when available.
 */
export const siteConfig = {
  eyebrow: "Data Analytics Portfolio Case Study",
  title: "Singapore HDB Resale Market",
  thesis:
    "Exploring official HDB resale transactions from 2017 onward: how the market has moved, which towns and flat types offer relatively more space per dollar, and what factors are associated with resale prices.",
  sourceLabel: "data.gov.sg — HDB resale flat prices",
  // TODO: not yet present in the repository -- add when the project is published.
  githubUrl: null as string | null,
  authorName: null as string | null,
  stack: ["Python", "pandas", "DuckDB", "SQL", "Next.js", "TypeScript"],
} as const;

export const methodologyReferences = [
  { label: "Data cleaning notes", path: "docs/data_cleaning.md" },
  { label: "EDA findings", path: "docs/eda_findings.md" },
  { label: "SQL analysis", path: "sql/README.md" },
  { label: "SQL queries", path: "sql/queries/" },
] as const;
