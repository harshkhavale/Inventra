"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useUI } from "@/components/providers/ui-provider";
import { Sub } from "@/components/shared/data-table";
import { Meter } from "@/components/shared/meter";
import { EmptyNote, Panel, PanelHeader, PanelRow } from "@/components/shared/panel";
import { RecordLink } from "@/components/shared/record-link";
import { Button } from "@/components/ui/button";
import { useCommands } from "@/hooks/use-commands";
import { godown } from "@/lib/constants";
import { formatDate, formatDateTime, formatMoney, formatNumber, percent } from "@/lib/format";
import {
  byNewest,
  canShip,
  confirmedSales,
  findCustomer,
  findSupplier,
  isOverdue,
  lowStockItems,
  orderTotal,
  pendingPurchases,
  qtyAcross,
  totalQty,
  units,
} from "@/lib/selectors";
import type { ActivityKind, InventoryState } from "@/lib/types";
import { cn } from "@/lib/utils";

function ViewAll({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function LowStockAlerts({ state }: { state: InventoryState }) {
  const { openDrawer, openModal } = useUI();
  const low = lowStockItems(state);
  const out = low.filter((i) => totalQty(i) === 0).length;
  const pending = pendingPurchases(state);
  const rows = [...low].sort((a, b) => totalQty(a) / a.minLevel - totalQty(b) / b.minLevel);

  return (
    <Panel>
      <PanelHeader
        title="Low stock alerts"
        description={low.length ? `${low.length} items below minimum · ${out} out of stock` : "All clear"}
        icon={
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <TriangleAlert aria-hidden className="size-4" />
          </span>
        }
        action={<ViewAll href="/stock?status=low">View all</ViewAll>}
      />
      {rows.length === 0 && <EmptyNote>Every item is above its minimum level.</EmptyNote>}
      {rows.map((i) => {
        const t = totalQty(i);
        const onOrder = qtyAcross(pending, i.sku);
        return (
          <PanelRow key={i.sku} className="items-start gap-3 py-3.5 sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <RecordLink onClick={() => openDrawer({ type: "item", sku: i.sku })} className="min-w-0">
                  {i.name}
                </RecordLink>
                <span className="tabular shrink-0 font-semibold whitespace-nowrap">
                  {formatNumber(t)} <span className="font-medium text-muted-foreground">/ min {formatNumber(i.minLevel)}</span>
                </span>
              </div>
              <Meter value={Math.max(2, percent(t, i.minLevel))} fill={t === 0 ? "bad" : "warn"} className="mt-2" label={`${i.name} stock against minimum`} />
              <Sub>
                {i.sku} ·{" "}
                <span className={onOrder ? "font-semibold text-success" : "text-danger"}>{onOrder ? `${formatNumber(onOrder)} on order` : "Nothing on order"}</span>
              </Sub>
            </div>
            <Button variant="outline" size="sm" onClick={() => openModal({ type: "purchase", sku: i.sku })}>
              Reorder
            </Button>
          </PanelRow>
        );
      })}
    </Panel>
  );
}

export function DispatchQueue({ state }: { state: InventoryState }) {
  const { openDrawer } = useUI();
  const { dispatchSale } = useCommands();
  const orders = [...confirmedSales(state)].sort(byNewest);

  return (
    <Panel>
      <PanelHeader title="Ready to dispatch" description="Confirmed orders · dispatching reduces stock" action={<ViewAll href="/sales?status=confirmed">All sales</ViewAll>} />
      {orders.length === 0 && <EmptyNote>No orders waiting. Nice work.</EmptyNote>}
      {orders.map((o) => {
        const ok = canShip(state, o);
        return (
          <PanelRow key={o.id}>
            <div className="min-w-0 flex-1">
              <div className="truncate">
                <RecordLink className="tabular" onClick={() => openDrawer({ type: "sale", id: o.id })}>
                  {o.id}
                </RecordLink>{" "}
                <span className="text-muted-foreground">· {findCustomer(state, o.customerId).name}</span>
              </div>
              <Sub>
                {formatMoney(orderTotal(o.lines))} · from {godown(o.godownId).short} ·{" "}
                <span className={ok ? "font-semibold text-success" : "text-danger"}>{ok ? "Stock available" : "Short on stock"}</span>
              </Sub>
            </div>
            <Button size="sm" onClick={() => dispatchSale(o.id)}>
              Dispatch
            </Button>
          </PanelRow>
        );
      })}
    </Panel>
  );
}

export function IncomingPurchases({ state }: { state: InventoryState }) {
  const { openDrawer } = useUI();
  const { receivePurchase } = useCommands();
  const orders = [...pendingPurchases(state)].sort((a, b) => a.expected.localeCompare(b.expected));

  return (
    <Panel>
      <PanelHeader title="Incoming purchases" description="Pending POs · receiving adds stock" action={<ViewAll href="/purchases?status=pending">All POs</ViewAll>} />
      {orders.length === 0 && <EmptyNote>Nothing on order right now.</EmptyNote>}
      {orders.map((p) => {
        const late = isOverdue(p);
        return (
          <PanelRow key={p.id}>
            <div className="min-w-0 flex-1">
              <div className="truncate">
                <RecordLink className="tabular" onClick={() => openDrawer({ type: "purchase", id: p.id })}>
                  {p.id}
                </RecordLink>{" "}
                <span className="text-muted-foreground">· {findSupplier(state, p.supplierId).name}</span>
              </div>
              <Sub>
                {formatNumber(units(p.lines))} units to {godown(p.godownId).short} ·{" "}
                <span className={cn(late && "text-danger")}>{late ? `Overdue since ${formatDate(p.expected)}` : `Due ${formatDate(p.expected)}`}</span>
              </Sub>
            </div>
            <Button variant="outline" size="sm" onClick={() => receivePurchase(p.id)}>
              Receive
            </Button>
          </PanelRow>
        );
      })}
    </Panel>
  );
}

const dotTone: Record<ActivityKind, string> = {
  sale: "bg-primary ring-info-soft",
  dispatch: "bg-warning-fill ring-warning-soft",
  pay: "bg-success-fill ring-success-soft",
  po: "bg-muted-foreground ring-secondary",
  receive: "bg-success-fill ring-success-soft",
  transfer: "bg-violet ring-violet-soft",
  alert: "bg-destructive ring-danger-soft",
};

export function ActivityFeed({ state }: { state: InventoryState }) {
  return (
    <Panel>
      <PanelHeader title="Recent activity" description="Across all godowns" />
      <ol className="flex flex-col gap-4 px-5 pt-1 pb-5">
        {state.activity.slice(0, 7).map((a, idx) => (
          <li key={`${a.at}-${idx}`} className="flex gap-3.5">
            <span aria-hidden className={cn("mt-[5px] size-2.5 shrink-0 rounded-full ring-4", dotTone[a.kind])} />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium">{a.title}</div>
              <Sub>
                {a.meta} · {formatDateTime(a.at)}
              </Sub>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
