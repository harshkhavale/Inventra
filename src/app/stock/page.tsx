import type { Metadata } from "next";
import { Suspense } from "react";
import { StockView } from "@/components/stock/stock-view";
import { PageHeader } from "@/components/shared/page-header";
import { ViewSkeleton } from "@/components/shared/misc";

export const metadata: Metadata = { title: "Stock" };

export default function StockPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader eyebrow="Operations" title="Stock" />
          <ViewSkeleton />
        </>
      }
    >
      <StockView />
    </Suspense>
  );
}
