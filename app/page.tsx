import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buildAnalyticsResponse } from "@/lib/analytics/build-response";
import { loadDataset } from "@/lib/data/loader";

export const dynamic = "force-dynamic";

export default function Page() {
  const dataset = loadDataset();
  const initialData = buildAnalyticsResponse(dataset, {
    towns: dataset.towns,
    flatTypes: dataset.flatTypes,
    includePartial: false,
  });

  return (
    <Suspense fallback={null}>
      <DashboardShell initialData={initialData} allTowns={dataset.towns} allFlatTypes={dataset.flatTypes} />
    </Suspense>
  );
}
