"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useUI } from "@/components/providers/ui-provider";
import { DataTable, Sub, type Column } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/filters";
import { Meter } from "@/components/shared/meter";
import { PageHeader } from "@/components/shared/page-header";
import { Panel, PanelHeader, EmptyNote } from "@/components/shared/panel";
import { RecordLink } from "@/components/shared/record-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { matches } from "@/hooks/use-url-filter";
import { godown, GODOWNS } from "@/lib/constants";
import { formatCompactMoney, formatDate, formatMoney, formatNumber, percent } from "@/lib/format";
import { findItem, stockValue, totalQty } from "@/lib/selectors";
import type { GodownId, Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useInventory } from "@/store/inventory-store";

export function GodownsView() {
  const state = useInventory();
  const { openDrawer, openModal } = useUI();
  const [selected, setSelected] = useState<GodownId>("HWH");
  const [query, setQuery] = useState("");

  const total = stockValue(state.items);
  const valueAt = (id: GodownId) => state.items.reduce((s, i) => s + i.stock[id] * i.cost, 0);
  const current = godown(selected);

  const rows = state.items
    .filter((i) => matches(query, i.name, i.sku))
    .sort((a, b) => b.stock[selected] * b.cost - a.stock[selected] * a.cost);

  const columns: Column<Item>[] = [
    {
      key: "item",
      header: "Item",
      className: "min-w-[200px]",
      cell: (i) => (
        <>
          <RecordLink onClick={() => openDrawer({ type: "item", sku: i.sku })}>{i.name}</RecordLink>
          <Sub className="tabular">{i.sku}</Sub>
        </>
      ),
    },
    { key: "cat", header: "Category", className: "w-[110px]", cell: (i) => <span className="text-muted-foreground">{i.category}</span> },
    {
      key: "qty",
      header: "Qty here",
      className: "w-[80px]",
      align: "right",
      cell: (i) => <span className={cn("tabular font-semibold", i.stock[selected] === 0 && "text-danger")}>{formatNumber(i.stock[selected])}</span>,
    },
    {
      key: "share",
      header: "Share of item’s stock",
      className: "min-w-[120px]",
      cell: (i) => {
        const share = percent(i.stock[selected], totalQty(i));
        return (
          <div className="flex items-center gap-2.5">
            <Meter value={share} fill="soft" className="flex-1" />
            <span className="tabular w-[38px] text-right text-[12.5px] text-muted-foreground">{Math.round(share)}%</span>
          </div>
        );
      },
    },
    { key: "value", header: "Value", className: "w-[100px]", align: "right", cell: (i) => <span className="tabular">{formatMoney(i.stock[selected] * i.cost)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Godowns"
        description="Pick a godown to see what it holds. Move stock between locations with a transfer."
        actions={
          <Button onClick={() => openModal({ type: "transfer", from: selected })}>
            <ArrowLeftRight aria-hidden className="size-4" /> Transfer stock
          </Button>
        }
      />

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}>
        {GODOWNS.map((g) => {
          const value = valueAt(g.id);
          const on = g.id === selected;
          return (
            <button
              key={g.id}
              type="button"
              aria-pressed={on}
              onClick={() => setSelected(g.id)}
              className={cn(
                "flex flex-col gap-3.5 rounded-[14px] border bg-white p-5 text-left transition",
                on ? "border-primary ring-3 ring-primary/15" : "border-border shadow-card hover:shadow-card-hover",
              )}
            >
              <div className="flex w-full justify-between gap-3">
                <div>
                  <div className="text-[15.5px] font-semibold">{g.name}</div>
                  <Sub>
                    {g.city} · {g.area}
                  </Sub>
                </div>
                <StatusBadge tone="neutral" dot={false} className="tabular">
                  {g.id}
                </StatusBadge>
              </div>
              <dl className="grid w-full grid-cols-3 gap-2.5">
                {[
                  ["Stock value", formatCompactMoney(value)],
                  ["Units", formatNumber(state.items.reduce((s, i) => s + i.stock[g.id], 0))],
                  ["SKUs held", `${state.items.filter((i) => i.stock[g.id] > 0).length} / ${state.items.length}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="tabular mt-0.5 text-base font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="w-full">
                <Meter value={percent(value, total)} />
                <Sub>
                  {Math.round(percent(value, total))}% of company stock value · Manager {g.manager}
                </Sub>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">{current.name}</h2>
              <Sub>Item-wise stock at this location</Sub>
            </div>
            <SearchInput label="Search godown items" placeholder="Search items in this godown" value={query} onChange={setQuery} />
          </div>
          <DataTable columns={columns} rows={rows} rowKey={(i) => i.sku} empty="No items match." />
        </Panel>

        <Panel>
          <PanelHeader title="Recent transfers" description="Between godowns" />
          {state.transfers.length === 0 && <EmptyNote>No transfers yet.</EmptyNote>}
          {state.transfers.slice(0, 6).map((t) => (
            <div key={t.id} className="border-t border-border px-5 py-[13px]">
              <div className="flex justify-between gap-2.5">
                <span className="tabular font-semibold">{t.id}</span>
                <span className="text-[12.5px] text-muted-foreground">{formatDate(t.date)}</span>
              </div>
              <div className="mt-0.5 text-[13.5px]">
                {formatNumber(t.qty)} × {findItem(state, t.sku).name}
              </div>
              <Sub>
                {godown(t.from).name} → {godown(t.to).name}
              </Sub>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
