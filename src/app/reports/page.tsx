import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsView } from "@/components/reports/reports-view";
import { PageHeader } from "@/components/shared/page-header";
import { ViewSkeleton } from "@/components/shared/misc";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader eyebrow="Insights" title="Reports" />
          <ViewSkeleton />
        </>
      }
    >
      <ReportsView />
    </Suspense>
  );
}
