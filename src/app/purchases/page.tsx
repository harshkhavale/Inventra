import type { Metadata } from "next";
import { Suspense } from "react";
import { PurchasesView } from "@/components/purchases/purchases-view";
import { OpenModalButton } from "@/components/ui/open-modal-button";
import { PageHeader } from "@/components/ui/page-header";
import { ViewSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Purchases" };

export default function PurchasesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Purchase orders"
        description="Mark a PO received when goods arrive at the godown and stock is added automatically."
        actions={<OpenModalButton modal={{ type: "purchase" }}>New purchase order</OpenModalButton>}
      />
      <Suspense fallback={<ViewSkeleton />}>
        <PurchasesView />
      </Suspense>
    </>
  );
}
