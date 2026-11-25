"use client";

import { useUI } from "@/components/providers/ui-provider";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader, Sub } from "@/components/ui/card";
import { BarRows } from "@/components/ui/charts";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatCard, StatGrid } from "@/components/ui/stat";
import { CATEGORIES, TODAY } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { formatCompactMoney, formatDate, formatMoney, formatNumber, formatSigned, percent } from "@/lib/format";
import { lowStockItems, marginPct, stockLevel, stockValue, totalQty } from "@/lib/selectors";
import { stockBadge } from "@/lib/status";
import type { InventoryState, Item } from "@/lib/types";
import { ExportButton } from "./export-button";
import type { Period } from "./reports-view";

export function StockReport({ state, period }: { state: InventoryState; period: Period }) {
  const { openDrawer } = useUI();
  const atCost = stockValue(state.items);
  const atRetail = state.items.reduce((s, i) => s + totalQty(i) * i.price, 0);
  const units = state.items.reduce((s, i) => s + totalQty(i), 0);
  const low = lowStockItems(state);

  const moves = state.movements.filter((m) => m.at.slice(0, 10) >= period.since);
  const sumOf = (type: string) => moves.filter((m) => m.type === type).reduce((s, m) => s + Math.abs(m.qty), 0);
  const inward = sumOf("Purchase");
  const outward = sumOf("Sale");
  const moved = sumOf("Transfer in");
  const flowMax = Math.max(inward, outward, moved, 1);

  const byCategory = CATEGORIES.map((c) => ({ c, v: stockValue(state.items.filter((i) => i.category === c)) }));
  const catMax = Math.max(1, ...byCategory.map((x) => x.v));

  const columns: Column<Item>[] = [
    {
      key: "item",
      header: "Item",
      width: "minmax(240px, 2fr)",
      cell: (i) => (
        <>
          <LinkButton onClick={() => openDrawer({ type: "item", sku: i.sku })}>{i.name}</LinkButton>
          <Sub className="tabular">{i.sku}</Sub>
        </>
      ),
    },
    { key: "cat", header: "Category", width: "130px", cell: (i) => <span className="text-muted">{i.category}</span> },
    { key: "qty", header: "On hand", width: "90px", align: "right", cell: (i) => <span className="tabular">{formatNumber(totalQty(i))}</span> },
    { key: "cv", header: "Cost value", width: "120px", align: "right", cell: (i) => <span className="tabular">{formatMoney(totalQty(i) * i.cost)}</span> },
    { key: "rv", header: "Retail value", width: "120px", align: "right", cell: (i) => <span className="tabular">{formatMoney(totalQty(i) * i.price)}</span> },
    { key: "margin", header: "Margin", width: "110px", align: "right", cell: (i) => <span className="tabular text-muted">{marginPct(i)}%</span> },
    {
      key: "status",
      header: "Status",
      width: "130px",
      cell: (i) => {
        const b = stockBadge[stockLevel(i)];
        return <Badge tone={b.tone}>{b.label}</Badge>;
      },
    },
  ];

  const exportCsv = () =>
    downloadCsv(
      `stock-register-${TODAY}.csv`,
      ["SKU", "Item", "Category", "Howrah", "Salt Lake", "Durgapur", "On hand", "Minimum", "Cost value", "Retail value", "Status"],
      state.items.map((i) => [i.sku, i.name, i.category, i.stock.HWH, i.stock.SLK, i.stock.DGP, totalQty(i), i.minLevel, totalQty(i) * i.cost, totalQty(i) * i.price, stockBadge[stockLevel(i)].label]),
    );

  return (
    <>
      <StatGrid min={200}>
        <StatCard label="Stock value at cost" value={formatCompactMoney(atCost)} sub={`${formatNumber(units)} units on hand`} />
        <StatCard label="Stock value at selling price" value={formatCompactMoney(atRetail)} sub={`${formatCompactMoney(atRetail - atCost)} potential gross margin`} />
        <StatCard label="Items below minimum" value={String(low.length)} sub={`${low.filter((i) => totalQty(i) === 0).length} out of stock`} />
        <StatCard label="Net movement in period" value={formatSigned(inward - outward)} sub="units, inward minus outward" />
      </StatGrid>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" }}>
        <Card className="pb-3">
          <CardHeader title="Stock value by category" subtitle="At cost price" />
          <BarRows data={byCategory.map(({ c, v }) => ({ key: c, label: c, value: formatCompactMoney(v), share: percent(v, catMax) }))} />
        </Card>
        <Card className="pb-3">
          <CardHeader title="Inward vs outward" subtitle={`Units moved in the last ${period.days} days`} />
          <BarRows
            data={[
              { key: "in", label: "Inward (purchases)", value: formatNumber(inward), share: percent(inward, flowMax), fill: "good" },
              { key: "out", label: "Outward (sales)", value: formatNumber(outward), share: percent(outward, flowMax), fill: "brand" },
              { key: "moved", label: "Moved between godowns", value: formatNumber(moved), share: percent(moved, flowMax), fill: "soft" },
            ]}
          />
        </Card>
      </div>

      <Card>
        <CardHeader title="Stock register" subtitle={`Snapshot as of ${formatDate(TODAY, true)}, all godowns`} action={<ExportButton onExport={exportCsv} />} />
        <DataTable columns={columns} rows={state.items} rowKey={(i) => i.sku} empty="No items." rowClassName="min-h-[50px]" />
      </Card>
    </>
  );
}
