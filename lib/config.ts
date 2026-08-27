import { APPRECIATION_MIN_N } from "@/lib/constants";

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

/**
 * The decision problem this project addresses, and who it's for. Kept as
 * data (not inline JSX prose) so it's edited in one place.
 */
export const businessContext = {
  problem:
    "How can a housing advisory, property marketplace, or market-intelligence team help users understand changes in Singapore's HDB resale market, compare price-and-space trade-offs across market segments, and identify important market signals using reliable transaction evidence?",
  framing:
    "This is a descriptive market-intelligence and decision-support tool, not an individual valuation model, a price forecast, investment advice, a mortgage affordability calculator, or proof that any town is objectively \"best.\"",
  primaryAudience:
    "Property advisory, housing marketplace, and residential market-intelligence teams.",
  secondaryAudiences: [
    "Prospective HDB resale buyers doing preliminary market research",
    "Property agents benchmarking market segments",
    "Housing or public-policy analysts monitoring broad resale-market signals",
  ],
} as const;

export const stakeholderUseCases = [
  {
    stakeholder: "Property advisory or agency",
    decision: "Compare market segments when responding to buyer enquiries",
    evidence: "Town, flat type, transaction volume, and price per sqm",
    limitation: "Does not include unit condition, exact amenities, or individual buyer priorities",
  },
  {
    stakeholder: "Property marketplace or content team",
    decision: "Identify segments and topics that merit educational content",
    evidence: "Transaction volume, town appreciation, and million-dollar share",
    limitation: "Historical growth does not imply future growth",
  },
  {
    stakeholder: "Buyer research",
    decision: "Compare broad price, size, lease, and storey trade-offs",
    evidence: "Town and flat-type filters, price per sqm, remaining lease and storey bands",
    limitation: "Lower price per sqm is not automatically better value for every buyer",
  },
  {
    stakeholder: "Market or policy analyst",
    decision: "Monitor broad changes in price levels and transaction composition",
    evidence: "Complete-year trends and the million-dollar transaction share",
    limitation: "Affordability cannot be measured without income, financing, and household data",
  },
] as const;

export const datasetLimitations = [
  "Buyer income or household circumstances",
  "Mortgage terms or interest-rate information",
  "Unit condition or renovation quality",
  "Exact accessibility or amenity measures (e.g. MRT distance)",
  "Buyer motivations",
  "Policy-impact attribution",
  "A transaction identifier",
  "A causal identification strategy",
] as const;

export const futureExtensions = [
  "MRT and amenity proximity",
  "Macroeconomic and interest-rate context",
  "Housing-policy event annotations",
  "A carefully designed multivariable model",
  "More detailed neighbourhood-level geography",
  "Automated data refreshes",
] as const;

export const analyticalDecisions = [
  {
    decision: "Medians, not means, for every price comparison",
    reason: "Resale-price distributions are right-skewed; a small number of very high-value transactions would otherwise distort a mean.",
  },
  {
    decision: "Complete calendar years detected dynamically",
    reason: "A year only counts as complete once all 12 calendar months are present, recomputed from the data on every load rather than hardcoded.",
  },
  {
    decision: "Latest incomplete month excluded, never deleted",
    reason: "The most recent month understates activity while still in progress; it stays in the underlying data, just out of full-year comparisons.",
  },
  {
    decision: "Exact duplicate-looking rows preserved",
    reason: "The dataset has no transaction ID, so identical rows may be genuine separate sales rather than export duplicates.",
  },
  {
    decision: "No arbitrary outlier removal",
    reason: "Rare but real categories (e.g. very large \"Terrace\" flats) were retained; medians were chosen specifically because they resist this kind of outlier.",
  },
  {
    decision: "Association language only for lease and storey",
    reason: "Both are confounded with town, flat age, and flat model; no causal claim is made anywhere in the analysis.",
  },
  {
    decision: `Minimum sample size (≥${APPRECIATION_MIN_N} transactions) for town appreciation rankings`,
    reason: "A thin town-year sample can swing sharply on one unusual sale, so towns below this threshold in either comparison year are excluded from the ranking rather than shown with an unstable figure.",
  },
  {
    decision: "Cross-validated between pandas and DuckDB SQL",
    reason: "Every headline figure was independently reproduced in SQL, not just computed once in Python.",
  },
  {
    decision: "Raw, processed, and deployment data kept conceptually separate",
    reason: "The raw CSV is never modified; the processed CSV adds derived columns without altering it; the deployed website reads a further-reduced, purpose-built export.",
  },
  {
    decision: "Analytics ported into the website, not rebuilt",
    reason: "The TypeScript analytics layer mirrors the approved Python logic function-for-function and is unit-tested against the same benchmark figures.",
  },
] as const;

export const skillsDemonstrated = [
  "Translating an open-ended business question into measurable analytical questions",
  "Transparent data validation and documented methodology",
  "SQL and Python fluency, cross-validated against each other",
  "Stakeholder-oriented communication of findings",
  "Interactive data visualization and filtering",
  "Reproducible, tested analytics",
  "Production deployment and quality assurance",
] as const;
