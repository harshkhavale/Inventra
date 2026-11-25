import type { Metadata } from "next";
import { Suspense } from "react";
import { SalesView } from "@/components/sales/sales-view";
import { PageHeader } from "@/components/shared/page-header";
import { OpenModalButton, ViewSkeleton } from "@/components/shared/misc";

export const metadata: Metadata = { title: "Sales" };

export default function SalesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Sales orders & invoices"
        description="Confirmed → Dispatched (invoice raised, stock reduced) → Paid."
        actions={<OpenModalButton modal={{ type: "sale" }}>New sales order</OpenModalButton>}
      />
      <Suspense fallback={<ViewSkeleton />}>
        <SalesView />
      </Suspense>
    </>
  );
}
