"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, SectionTitle, Totals } from "@/components/ui/dialog";
import { useCommands } from "@/hooks/use-commands";
import { godown } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { findCustomer, findItem, findSupplier, gst, orderTotal, subtotal } from "@/lib/selectors";
import { purchaseBadge, saleTone } from "@/lib/status";
import type { InventoryState, LineItem } from "@/lib/types";
import { useInventory } from "@/store/inventory-store";

interface Step {
  label: string;
  detail: string;
  done: boolean;
}

/** Shared drawer for a sales order or a purchase order. */
export function OrderDrawer({ kind, id, onClose }: { kind: "sale" | "purchase"; id: string; onClose: () => void }) {
  const state = useInventory();
  const commands = useCommands();
  const view = kind === "sale" ? saleView(state, id, commands) : purchaseView(state, id, commands);
  if (!view) return null;

  return (
    <Drawer
      label="Order details"
      eyebrow={view.kind}
      title={id}
      titleClassName="tabular"
      badge={<Badge tone={view.badge.tone}>{view.badge.label}</Badge>}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[10px] bg-tint p-3.5">
          <div className="text-xs text-muted">{view.partyLabel}</div>
          <div className="mt-1 font-semibold">{view.party.name}</div>
          <div className="mt-0.5 text-[12.5px] text-muted">{view.party.city}</div>
          <div className="tabular mt-0.5 text-[12.5px] text-muted">GSTIN {view.party.gstin}</div>
        </div>
        <dl className="flex flex-col gap-1.5 rounded-[10px] bg-tint p-3.5 text-[13px]">
          {view.meta.map((f) => (
            <div key={f.k} className="flex justify-between gap-2.5">
              <dt className="text-muted">{f.k}</dt>
              <dd className="tabular font-semibold">{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <SectionTitle>Line items</SectionTitle>
        <LineTable state={state} lines={view.lines} availabilityAt={view.availabilityAt} />
        <div className="mt-3.5">
          <Totals subtotal={formatMoney(subtotal(view.lines))} gst={formatMoney(gst(view.lines))} total={formatMoney(orderTotal(view.lines))} />
        </div>
      </div>

      <div>
        <SectionTitle>Progress</SectionTitle>
        <ol className="flex flex-col gap-3.5">
          {view.steps.map((s) => (
            <li key={s.label} className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 text-white",
                  s.done ? "border-good-fill bg-good-fill" : "border-field bg-white",
                )}
              >
                <Check aria-hidden className="size-3" strokeWidth={3} />
              </span>
              <div>
                <div className="text-[13.5px] font-semibold">{s.label}</div>
                <div className="mt-0.5 text-[12.5px] text-muted">{s.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {view.action && (
          <Button variant="primary" onClick={view.action.run}>
            {view.action.label}
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </div>
    </Drawer>
  );
}

function LineTable({ state, lines, availabilityAt }: { state: InventoryState; lines: LineItem[]; availabilityAt?: ReturnType<typeof godown> }) {
  const grid = "grid grid-cols-[1fr_60px_84px_96px] gap-2.5";
  return (
    <div className="overflow-x-auto rounded-[10px] border border-line-soft">
      <div className="min-w-[420px]">
        <div className={cn(grid, "bg-subtle px-3.5 py-2 text-[11.5px] font-semibold tracking-[0.05em] text-muted uppercase")}>
          <span>Item</span>
          <span className="justify-self-end">Qty</span>
          <span className="justify-self-end">Rate</span>
          <span className="justify-self-end">Amount</span>
        </div>
        {lines.map((l) => {
          const item = findItem(state, l.sku);
          const available = availabilityAt ? item.stock[availabilityAt.id] : null;
          return (
            <div key={l.sku} className={cn(grid, "items-center border-t border-line-soft px-3.5 py-2.5")}>
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium">{item.name}</div>
                <div className="tabular mt-0.5 text-[12.5px] text-muted">
                  {l.sku}
                  {available !== null && (
                    <span className={available >= l.qty ? "font-semibold text-good" : "text-bad"}>
                      {" "}
                      · {available} available at {availabilityAt!.short}
                    </span>
                  )}
                </div>
              </div>
              <span className="tabular justify-self-end">{formatNumber(l.qty)}</span>
              <span className="tabular justify-self-end text-muted">{formatMoney(l.rate)}</span>
              <span className="tabular justify-self-end font-semibold">{formatMoney(l.qty * l.rate)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Commands = ReturnType<typeof useCommands>;

function saleView(state: InventoryState, id: string, commands: Commands) {
  const o = state.sales.find((x) => x.id === id);
  if (!o) return null;
  const g = godown(o.godownId);
  const steps: Step[] = [
    { label: "Order confirmed", detail: formatDate(o.date, true), done: true },
    { label: "Dispatched & invoiced", detail: o.dispatchedOn ? `${formatDate(o.dispatchedOn, true)} · ${o.invoice}` : `Reduces stock at ${g.short}`, done: o.status !== "Confirmed" },
    { label: "Payment received", detail: o.paidOn ? formatDate(o.paidOn, true) : "Pending", done: o.status === "Paid" },
  ];
  const action =
    o.status === "Confirmed"
      ? { label: "Dispatch & raise invoice", run: () => commands.dispatchSale(o.id) }
      : o.status === "Dispatched"
        ? { label: "Record payment", run: () => commands.markSalePaid(o.id) }
        : null;
  return {
    kind: "Sales order",
    badge: { label: o.status, tone: saleTone[o.status] },
    partyLabel: "Bill to",
    party: findCustomer(state, o.customerId),
    meta: [
      { k: "Order date", v: formatDate(o.date, true) },
      { k: "Dispatch from", v: g.short },
      { k: "Invoice", v: o.invoice || "On dispatch" },
    ],
    lines: o.lines,
    availabilityAt: o.status === "Confirmed" ? g : undefined,
    steps,
    action,
  };
}

function purchaseView(state: InventoryState, id: string, commands: Commands) {
  const p = state.purchases.find((x) => x.id === id);
  if (!p) return null;
  const g = godown(p.godownId);
  return {
    kind: "Purchase order",
    badge: purchaseBadge(p),
    partyLabel: "Supplier",
    party: findSupplier(state, p.supplierId),
    meta: [
      { k: "Raised on", v: formatDate(p.date, true) },
      { k: "Deliver to", v: g.short },
      { k: "Expected", v: formatDate(p.expected, true) },
    ],
    lines: p.lines,
    availabilityAt: undefined,
    steps: [
      { label: "PO raised", detail: formatDate(p.date, true), done: true },
      { label: "Goods received", detail: p.receivedOn ? `${formatDate(p.receivedOn, true)} at ${g.short}` : `Adds stock at ${g.short}`, done: p.status === "Received" },
    ],
    action: p.status === "Pending" ? { label: "Mark goods received", run: () => commands.receivePurchase(p.id) } : null,
  };
}
