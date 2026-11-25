"use client";

import { Check } from "lucide-react";
import { SectionTitle, Totals } from "@/components/shared/misc";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCommands } from "@/hooks/use-commands";
import { godown } from "@/lib/constants";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { findCustomer, findItem, findSupplier, gst, orderTotal, subtotal } from "@/lib/selectors";
import { purchaseBadge, saleTone } from "@/lib/status";
import type { Godown, InventoryState, LineItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useInventory } from "@/store/inventory-store";
import { DetailSheet } from "./overlay-shells";

interface Step {
  label: string;
  detail: string;
  done: boolean;
}

/** Shared detail sheet for a sales order or a purchase order. */
export function OrderDrawer({ kind, id, onClose }: { kind: "sale" | "purchase"; id: string; onClose: () => void }) {
  const state = useInventory();
  const commands = useCommands();
  const view = kind === "sale" ? saleView(state, id, commands) : purchaseView(state, id, commands);
  if (!view) return null;

  return (
    <DetailSheet
      eyebrow={view.kind}
      title={id}
      titleClassName="tabular"
      description={`${view.kind} ${id} details`}
      badge={<StatusBadge tone={view.badge.tone}>{view.badge.label}</StatusBadge>}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-muted/60 p-3.5">
          <div className="text-xs text-muted-foreground">{view.partyLabel}</div>
          <div className="mt-1 font-semibold">{view.party.name}</div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">{view.party.city}</div>
          <div className="tabular mt-0.5 text-[12.5px] text-muted-foreground">GSTIN {view.party.gstin}</div>
        </div>
        <dl className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-3.5 text-[13px]">
          {view.meta.map((f) => (
            <div key={f.k} className="flex justify-between gap-2.5">
              <dt className="text-muted-foreground">{f.k}</dt>
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
                  s.done ? "border-success-fill bg-success-fill" : "border-input bg-card",
                )}
              >
                <Check aria-hidden className="size-3" strokeWidth={3} />
              </span>
              <div>
                <div className="text-[13.5px] font-semibold">{s.label}</div>
                <div className="mt-0.5 text-[12.5px] text-muted-foreground">{s.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {view.action && <Button onClick={view.action.run}>{view.action.label}</Button>}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </DetailSheet>
  );
}

function LineTable({ state, lines, availabilityAt }: { state: InventoryState; lines: LineItem[]; availabilityAt?: Godown }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-3.5 text-[11.5px] font-semibold tracking-wider text-muted-foreground uppercase">Item</TableHead>
            <TableHead className="text-right text-[11.5px] font-semibold tracking-wider text-muted-foreground uppercase">Qty</TableHead>
            <TableHead className="text-right text-[11.5px] font-semibold tracking-wider text-muted-foreground uppercase">Rate</TableHead>
            <TableHead className="pr-3.5 text-right text-[11.5px] font-semibold tracking-wider text-muted-foreground uppercase">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((l) => {
            const item = findItem(state, l.sku);
            const available = availabilityAt ? item.stock[availabilityAt.id] : null;
            return (
              <TableRow key={l.sku}>
                <TableCell className="py-2.5 pl-3.5 whitespace-normal">
                  <div className="text-[13.5px] font-medium">{item.name}</div>
                  <div className="tabular mt-0.5 text-[12.5px] text-muted-foreground">
                    {l.sku}
                    {available !== null && (
                      <span className={available >= l.qty ? "font-semibold text-success" : "text-danger"}>
                        {" "}
                        · {available} available at {availabilityAt!.short}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="tabular text-right">{formatNumber(l.qty)}</TableCell>
                <TableCell className="tabular text-right text-muted-foreground">{formatMoney(l.rate)}</TableCell>
                <TableCell className="tabular pr-3.5 text-right font-semibold">{formatMoney(l.qty * l.rate)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
