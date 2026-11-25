import type { Metadata } from "next";
import { Suspense } from "react";
import { SalesView } from "@/components/sales/sales-view";
import { OpenModalButton } from "@/components/ui/open-modal-button";
import { PageHeader } from "@/components/ui/page-header";
import { ViewSkeleton } from "@/components/ui/skeleton";

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
