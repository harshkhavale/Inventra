"use client";

import { Meter } from "@/components/shared/meter";
import { SectionTitle } from "@/components/shared/misc";
import { StatusBadge } from "@/components/shared/status-badge";
import { useUI } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { godown, GODOWNS } from "@/lib/constants";
import { formatDateTime, formatMoney, formatNumber, formatSigned, percent } from "@/lib/format";
import {
  confirmedSales,
  findItem,
  findSupplier,
  marginPct,
  movementsWithBalance,
  pendingPurchases,
  qtyAcross,
  stockLevel,
  totalQty,
} from "@/lib/selectors";
import { stockBadge } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useInventory } from "@/store/inventory-store";
import { DetailSheet } from "./overlay-shells";

export function ItemDrawer({ sku, onClose }: { sku: string; onClose: () => void }) {
  const state = useInventory();
  const { openModal } = useUI();
  const item = findItem(state, sku);
  const total = totalQty(item);
  const status = stockBadge[stockLevel(item)];
  const supplier = findSupplier(state, item.supplierId);
  const maxAtGodown = Math.max(1, ...GODOWNS.map((g) => item.stock[g.id]));
  const history = movementsWithBalance(state, sku, 20);

  const tiles = [
    { label: "On hand", value: total },
    { label: "Minimum", value: item.minLevel },
    { label: "On order", value: qtyAcross(pendingPurchases(state), sku) },
    { label: "Committed", value: qtyAcross(confirmedSales(state), sku) },
  ];

  const facts = [
    { k: "Cost price", v: `${formatMoney(item.cost)} / ${item.unit}` },
    { k: "Selling price", v: `${formatMoney(item.price)} / ${item.unit}` },
    { k: "Gross margin", v: `${marginPct(item)}%` },
    { k: "Stock value", v: formatMoney(total * item.cost) },
    { k: "Supplier", v: supplier.name },
    { k: "Lead time", v: `${supplier.leadDays} days` },
  ];

  return (
    <DetailSheet
      eyebrow={`${item.sku} · ${item.category}`}
      title={item.name}
      description={`Stock, pricing and movement history for ${item.name}`}
      badge={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg bg-muted/60 p-3">
            <div className="text-xs text-muted-foreground">{t.label}</div>
            <div className="tabular mt-0.5 text-lg font-semibold">{formatNumber(t.value)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openModal({ type: "purchase", sku })}>Reorder from supplier</Button>
        <Button variant="outline" onClick={() => openModal({ type: "transfer", sku })}>
          Transfer between godowns
        </Button>
      </div>

      <div>
        <SectionTitle>Stock by godown</SectionTitle>
        {GODOWNS.map((g) => (
          <div key={g.id} className="grid grid-cols-[minmax(0,130px)_1fr_70px] items-center gap-3 py-1.5">
            <span className="text-[13.5px]">{g.name}</span>
            <Meter value={percent(item.stock[g.id], maxAtGodown)} className="h-2" label={g.name} />
            <span className="tabular text-right font-semibold">{formatNumber(item.stock[g.id])}</span>
          </div>
        ))}
      </div>

      <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-[13.5px] sm:grid-cols-2">
        {facts.map((f) => (
          <div key={f.k} className="flex justify-between gap-2.5 border-b pb-2.5">
            <dt className="text-muted-foreground">{f.k}</dt>
            <dd className="tabular text-right font-semibold">{f.v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <SectionTitle className="mb-1 text-sm font-semibold">Stock history</SectionTitle>
        <p className="mb-2.5 text-[12.5px] text-muted-foreground">Every movement, newest first, with the company-wide balance after it</p>
        <div className="overflow-hidden rounded-lg border">
          {history.map((m, idx) => (
            <div key={`${m.at}-${m.ref}-${m.godownId}-${idx}`}>
              {idx > 0 && <Separator />}
              <div className="grid grid-cols-[1fr_70px_70px] items-center gap-2.5 px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">
                    {m.type} · <span className="tabular">{m.ref}</span>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {formatDateTime(m.at)} · {godown(m.godownId).short}
                  </div>
                </div>
                <span className={cn("tabular text-right font-semibold", m.qty > 0 ? "text-success" : "text-danger")}>{formatSigned(m.qty)}</span>
                <span className="tabular text-right text-muted-foreground">{formatNumber(m.balanceAfter)}</span>
              </div>
            </div>
          ))}
          {history.length === 0 && <div className="px-3.5 py-4 text-muted-foreground">No movements yet.</div>}
        </div>
      </div>
    </DetailSheet>
  );
}
