import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsView } from "@/components/reports/reports-view";
import { PageHeader } from "@/components/ui/page-header";
import { ViewSkeleton } from "@/components/ui/skeleton";

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
