"use client";

import { ArrowLeftRight, Plus } from "lucide-react";
import { useUI, type ModalState } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Header action that opens one of the global forms, so page headers can stay server components. */
export function OpenModalButton({ modal, children }: { modal: ModalState; children: React.ReactNode }) {
  const { openModal } = useUI();
  const Icon = modal.type === "transfer" ? ArrowLeftRight : Plus;
  return (
    <Button onClick={() => openModal(modal)}>
      <Icon aria-hidden />
      {children}
    </Button>
  );
}

/** Placeholder while a client-rendered view mounts. shadcn Skeleton. */
export function ViewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-5">
      <div className="grid gap-3.5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl bg-muted" />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-xl bg-muted" />
    </div>
  );
}

/** Subtotal / GST / Total block on orders and order forms. */
export function Totals({ subtotal, gst, total }: { subtotal: string; gst: string; total: string }) {
  return (
    <dl className="ml-auto flex w-[min(280px,100%)] flex-col gap-1.5 text-[13.5px]">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular">{subtotal}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">GST 18%</dt>
        <dd className="tabular">{gst}</dd>
      </div>
      <div className="flex justify-between border-t pt-2 text-base font-semibold">
        <dt>Total</dt>
        <dd className="tabular">{total}</dd>
      </div>
    </dl>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={className ?? "mb-3 text-sm font-semibold"}>{children}</h3>;
}
