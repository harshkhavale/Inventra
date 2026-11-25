"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useUI } from "@/components/providers/ui-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardHeader, CardRow, EmptyState, Sub } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCommands } from "@/hooks/use-commands";
import { godown } from "@/lib/constants";
import { cn } from "@/lib/cn";
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

function ViewAll({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-[30px] shrink-0 items-center rounded-lg whitespace-nowrap px-2.5 text-[12.5px] font-semibold text-brand hover:bg-brand-soft">
      {children}
    </Link>
  );
}

export function LowStockAlerts({ state }: { state: InventoryState }) {
  const { openDrawer, openModal } = useUI();
  const low = lowStockItems(state);
  const out = low.filter((i) => totalQty(i) === 0).length;
  const pending = pendingPurchases(state);
  const rows = [...low].sort((a, b) => totalQty(a) / a.minLevel - totalQty(b) / b.minLevel);

  return (
    <Card>
      <CardHeader
        title="Low stock alerts"
        subtitle={low.length ? `${low.length} items below minimum · ${out} out of stock` : "All clear"}
        icon={
          <span className="inline-flex size-[30px] items-center justify-center rounded-lg bg-bad-bg text-bad">
            <TriangleAlert aria-hidden className="size-4" />
          </span>
        }
        action={<ViewAll href="/stock?status=low">View all</ViewAll>}
      />
      {rows.length === 0 && <EmptyState>Every item is above its minimum level.</EmptyState>}
      {rows.map((i) => {
        const t = totalQty(i);
        const onOrder = qtyAcross(pending, i.sku);
        return (
          <CardRow key={i.sku} className="gap-4 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <LinkButton onClick={() => openDrawer({ type: "item", sku: i.sku })} className="truncate">
                  {i.name}
                </LinkButton>
                <span className="tabular font-[650] whitespace-nowrap">
                  {formatNumber(t)} <span className="font-medium text-muted">/ min {formatNumber(i.minLevel)}</span>
                </span>
              </div>
              <Progress value={Math.max(2, percent(t, i.minLevel))} fill={t === 0 ? "bad" : "warn"} className="mt-2" />
              <Sub>
                {i.sku} ·{" "}
                <span className={onOrder ? "font-semibold text-good" : "text-bad"}>{onOrder ? `${formatNumber(onOrder)} on order` : "Nothing on order"}</span>
              </Sub>
            </div>
            <Button size="sm" onClick={() => openModal({ type: "purchase", sku: i.sku })}>
              Reorder
            </Button>
          </CardRow>
        );
      })}
    </Card>
  );
}

export function DispatchQueue({ state }: { state: InventoryState }) {
  const { openDrawer } = useUI();
  const { dispatchSale } = useCommands();
  const orders = [...confirmedSales(state)].sort(byNewest);

  return (
    <Card>
      <CardHeader title="Ready to dispatch" subtitle="Confirmed orders · dispatching reduces stock" action={<ViewAll href="/sales?status=confirmed">All sales</ViewAll>} />
      {orders.length === 0 && <EmptyState>No orders waiting. Nice work.</EmptyState>}
      {orders.map((o) => {
        const ok = canShip(state, o);
        return (
          <CardRow key={o.id}>
            <div className="min-w-0 flex-1">
              <div className="truncate">
                <LinkButton onClick={() => openDrawer({ type: "sale", id: o.id })}>{o.id}</LinkButton>{" "}
                <span className="text-muted">· {findCustomer(state, o.customerId).name}</span>
              </div>
              <Sub>
                {formatMoney(orderTotal(o.lines))} · from {godown(o.godownId).short} ·{" "}
                <span className={ok ? "font-semibold text-good" : "text-bad"}>{ok ? "Stock available" : "Short on stock"}</span>
              </Sub>
            </div>
            <Button size="sm" variant="dark" onClick={() => dispatchSale(o.id)}>
              Dispatch
            </Button>
          </CardRow>
        );
      })}
    </Card>
  );
}

export function IncomingPurchases({ state }: { state: InventoryState }) {
  const { openDrawer } = useUI();
  const { receivePurchase } = useCommands();
  const orders = [...pendingPurchases(state)].sort((a, b) => a.expected.localeCompare(b.expected));

  return (
    <Card>
      <CardHeader title="Incoming purchases" subtitle="Pending POs · receiving adds stock" action={<ViewAll href="/purchases?status=pending">All POs</ViewAll>} />
      {orders.length === 0 && <EmptyState>Nothing on order right now.</EmptyState>}
      {orders.map((p) => {
        const late = isOverdue(p);
        return (
          <CardRow key={p.id}>
            <div className="min-w-0 flex-1">
              <div className="truncate">
                <LinkButton onClick={() => openDrawer({ type: "purchase", id: p.id })}>{p.id}</LinkButton>{" "}
                <span className="text-muted">· {findSupplier(state, p.supplierId).name}</span>
              </div>
              <Sub>
                {formatNumber(units(p.lines))} units to {godown(p.godownId).short} ·{" "}
                <span className={cn(late && "text-bad")}>{late ? `Overdue since ${formatDate(p.expected)}` : `Due ${formatDate(p.expected)}`}</span>
              </Sub>
            </div>
            <Button size="sm" onClick={() => receivePurchase(p.id)}>
              Receive
            </Button>
          </CardRow>
        );
      })}
    </Card>
  );
}

const dotTone: Record<ActivityKind, string> = {
  sale: "bg-brand ring-[#e8ecff]",
  dispatch: "bg-warn-fill ring-warn-bg",
  pay: "bg-good-fill ring-good-bg",
  po: "bg-muted ring-[#eef0f3]",
  receive: "bg-good-fill ring-good-bg",
  transfer: "bg-violet ring-violet-bg",
  alert: "bg-bad-fill ring-bad-bg",
};

export function ActivityFeed({ state }: { state: InventoryState }) {
  return (
    <Card>
      <CardHeader title="Recent activity" subtitle="Across all godowns" />
      <ol className="flex flex-col gap-4 px-5 pt-1 pb-[18px]">
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
    </Card>
  );
}
