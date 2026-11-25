"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, SectionTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useUI } from "@/components/providers/ui-provider";
import { godown, GODOWNS } from "@/lib/constants";
import { cn } from "@/lib/cn";
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
import { useInventory } from "@/store/inventory-store";

export function ItemDrawer({ sku, onClose }: { sku: string; onClose: () => void }) {
  const state = useInventory();
  const { openModal } = useUI();
  const item = findItem(state, sku);
  const total = totalQty(item);
  const status = stockBadge[stockLevel(item)];
  const supplier = findSupplier(state, item.supplierId);
  const maxAtGodown = Math.max(1, ...GODOWNS.map((g) => item.stock[g.id]));

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

  const history = movementsWithBalance(state, sku, 20);

  return (
    <Drawer
      label="Item details"
      eyebrow={`${item.sku} · ${item.category}`}
      title={item.name}
      badge={<Badge tone={status.tone}>{status.label}</Badge>}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-[10px] bg-tint p-3">
            <div className="text-xs text-muted">{t.label}</div>
            <div className="tabular mt-0.5 text-lg font-[650]">{formatNumber(t.value)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => openModal({ type: "purchase", sku })}>
          Reorder from supplier
        </Button>
        <Button onClick={() => openModal({ type: "transfer", sku })}>Transfer between godowns</Button>
      </div>

      <div>
        <SectionTitle>Stock by godown</SectionTitle>
        {GODOWNS.map((g) => (
          <div key={g.id} className="grid grid-cols-[minmax(0,130px)_1fr_70px] items-center gap-3 py-1.5">
            <span className="text-[13.5px]">{g.name}</span>
            <Progress value={percent(item.stock[g.id], maxAtGodown)} className="h-2" />
            <span className="tabular justify-self-end font-semibold">{formatNumber(item.stock[g.id])}</span>
          </div>
        ))}
      </div>

      <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-[13.5px] sm:grid-cols-2">
        {facts.map((f) => (
          <div key={f.k} className="flex justify-between gap-2.5 border-b border-line-soft pb-2.5">
            <dt className="text-muted">{f.k}</dt>
            <dd className="tabular text-right font-semibold">{f.v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <SectionTitle className="mb-1">Stock history</SectionTitle>
        <p className="mb-2.5 text-[12.5px] text-muted">Every movement, newest first, with the company-wide balance after it</p>
        <div className="overflow-hidden rounded-[10px] border border-line-soft">
          {history.map((m, idx) => (
            <div key={`${m.at}-${m.ref}-${m.godownId}-${idx}`} className="grid grid-cols-[1fr_70px_70px] items-center gap-2.5 border-b border-line-soft px-3.5 py-2.5 last:border-b-0">
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium">
                  {m.type} · <span className="tabular">{m.ref}</span>
                </div>
                <div className="mt-0.5 text-[12.5px] text-muted">
                  {formatDateTime(m.at)} · {godown(m.godownId).short}
                </div>
              </div>
              <span className={cn("tabular justify-self-end font-semibold", m.qty > 0 ? "text-good" : "text-bad")}>{formatSigned(m.qty)}</span>
              <span className="tabular justify-self-end text-muted">{formatNumber(m.balanceAfter)}</span>
            </div>
          ))}
          {history.length === 0 && <div className="px-3.5 py-4 text-muted">No movements yet.</div>}
        </div>
      </div>
    </Drawer>
  );
}
