"use client";

import { useUI } from "@/components/providers/ui-provider";
import { BarRows } from "@/components/shared/charts";
import { DataTable, Sub, type Column } from "@/components/shared/data-table";
import { Panel, PanelHeader } from "@/components/shared/panel";
import { RecordLink } from "@/components/shared/record-link";
import { StatCard, StatGrid } from "@/components/shared/stat";
import { StatusBadge } from "@/components/shared/status-badge";
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
      className: "min-w-[240px]",
      cell: (i) => (
        <>
          <RecordLink onClick={() => openDrawer({ type: "item", sku: i.sku })}>{i.name}</RecordLink>
          <Sub className="tabular">{i.sku}</Sub>
        </>
      ),
    },
    { key: "cat", header: "Category", className: "w-[130px]", cell: (i) => <span className="text-muted-foreground">{i.category}</span> },
    { key: "qty", header: "On hand", className: "w-[90px]", align: "right", cell: (i) => <span className="tabular">{formatNumber(totalQty(i))}</span> },
    { key: "cv", header: "Cost value", className: "w-[120px]", align: "right", cell: (i) => <span className="tabular">{formatMoney(totalQty(i) * i.cost)}</span> },
    { key: "rv", header: "Retail value", className: "w-[120px]", align: "right", cell: (i) => <span className="tabular">{formatMoney(totalQty(i) * i.price)}</span> },
    { key: "margin", header: "Margin", className: "w-[110px]", align: "right", cell: (i) => <span className="tabular text-muted-foreground">{marginPct(i)}%</span> },
    {
      key: "status", mobile: "aside",
      header: "Status",
      className: "w-[130px]",
      cell: (i) => {
        const b = stockBadge[stockLevel(i)];
        return <StatusBadge tone={b.tone}>{b.label}</StatusBadge>;
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
      <StatGrid min={150}>
        <StatCard label="Stock value at cost" value={formatCompactMoney(atCost)} sub={`${formatNumber(units)} units on hand`} />
        <StatCard label="Stock value at selling price" value={formatCompactMoney(atRetail)} sub={`${formatCompactMoney(atRetail - atCost)} potential gross margin`} />
        <StatCard label="Items below minimum" value={String(low.length)} sub={`${low.filter((i) => totalQty(i) === 0).length} out of stock`} />
        <StatCard label="Net movement in period" value={formatSigned(inward - outward)} sub="units, inward minus outward" />
      </StatGrid>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" }}>
        <Panel className="pb-3">
          <PanelHeader title="Stock value by category" description="At cost price" />
          <BarRows data={byCategory.map(({ c, v }) => ({ key: c, label: c, value: formatCompactMoney(v), share: percent(v, catMax) }))} />
        </Panel>
        <Panel className="pb-3">
          <PanelHeader title="Inward vs outward" description={`Units moved in the last ${period.days} days`} />
          <BarRows
            data={[
              { key: "in", label: "Inward (purchases)", value: formatNumber(inward), share: percent(inward, flowMax), fill: "good" },
              { key: "out", label: "Outward (sales)", value: formatNumber(outward), share: percent(outward, flowMax), fill: "brand" },
              { key: "moved", label: "Moved between godowns", value: formatNumber(moved), share: percent(moved, flowMax), fill: "soft" },
            ]}
          />
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Stock register" description={`Snapshot as of ${formatDate(TODAY, true)}, all godowns`} action={<ExportButton onExport={exportCsv} />} />
        <DataTable columns={columns} rows={state.items} rowKey={(i) => i.sku} empty="No items." />
      </Panel>
    </>
  );
}
