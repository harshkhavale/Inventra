"use client";

import { useState } from "react";
import { useUI } from "@/components/providers/ui-provider";
import { OptionSelect } from "@/components/overlays/selects";
import { DataTable, Sub, type Column } from "@/components/shared/data-table";
import { FilterChips, SearchInput, ViewTabs, Toolbar } from "@/components/shared/filters";
import { PageHeader } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { RecordLink } from "@/components/shared/record-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { matches, useUrlFilter } from "@/hooks/use-url-filter";
import { CATEGORIES, godown, GODOWNS } from "@/lib/constants";
import { formatCompactMoney, formatDateTime, formatMoney, formatNumber, formatSigned } from "@/lib/format";
import { findItem, stockLevel, stockValue, totalQty } from "@/lib/selectors";
import { movementTone, stockBadge } from "@/lib/status";
import type { Category, InventoryState, Item, StockMovement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useInventory } from "@/store/inventory-store";

const TABS = ["items", "history"] as const;
type Tab = (typeof TABS)[number];

export function StockView() {
  const state = useInventory();
  const [tab, setTab] = useUrlFilter<Tab>("view", TABS, "items");
  const units = state.items.reduce((s, i) => s + totalQty(i), 0);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Stock"
        description={`${state.items.length} SKUs · ${formatNumber(units)} units · ${formatCompactMoney(stockValue(state.items))} at cost`}
        actions={
          <ViewTabs
            label="Stock view"
            value={tab}
            onChange={setTab}
            options={[
              { key: "items", label: "Items" },
              { key: "history", label: "Stock history" },
            ]}
          />
        }
      />
      {tab === "items" ? <ItemsTable state={state} /> : <HistoryTable state={state} />}
    </>
  );
}

/* ------------------------------------------------------------------ Items */

const LEVELS = ["all", "ok", "low", "out"] as const;
type LevelFilter = (typeof LEVELS)[number];
const LEVEL_LABEL: Record<LevelFilter, string> = { all: "All items", ok: "In stock", low: "Below minimum", out: "Out of stock" };

function inLevel(i: Item, f: LevelFilter) {
  const level = stockLevel(i);
  if (f === "all") return true;
  if (f === "low") return level !== "ok"; // "below minimum" includes items at zero
  return level === f;
}

function ItemsTable({ state }: { state: InventoryState }) {
  const { openDrawer } = useUI();
  const [level, setLevel] = useUrlFilter<LevelFilter>("status", LEVELS, "all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  const search = (i: Item) => matches(query, i.name, i.sku) && (category === "all" || i.category === category);
  const rows = state.items.filter((i) => inLevel(i, level) && search(i));

  const columns: Column<Item>[] = [
    {
      key: "item",
      header: "Item",
      className: "min-w-[220px]",
      cell: (i) => (
        <>
          <RecordLink onClick={() => openDrawer({ type: "item", sku: i.sku })}>{i.name}</RecordLink>
          <Sub className="tabular">
            {i.sku} · per {i.unit}
          </Sub>
        </>
      ),
    },
    { key: "cat", header: "Category", className: "w-[120px]", cell: (i) => <span className="text-muted-foreground">{i.category}</span> },
    ...GODOWNS.map<Column<Item>>((g) => ({
      key: g.id,
      header: g.short,
      className: "w-[80px]",
      align: "right",
      cell: (i) => <span className={cn("tabular", i.stock[g.id] === 0 && "text-muted-foreground/60")}>{formatNumber(i.stock[g.id])}</span>,
    })),
    { key: "total", header: "Total", className: "w-[80px]", align: "right", cell: (i) => <span className="tabular font-semibold">{formatNumber(totalQty(i))}</span> },
    { key: "min", header: "Min", className: "w-[60px]", align: "right", cell: (i) => <span className="tabular text-muted-foreground">{formatNumber(i.minLevel)}</span> },
    {
      key: "status",
      header: "Status",
      className: "w-[120px]",
      cell: (i) => {
        const b = stockBadge[stockLevel(i)];
        return <StatusBadge tone={b.tone}>{b.label}</StatusBadge>;
      },
    },
    { key: "value", header: "Value", className: "w-[110px]", align: "right", cell: (i) => <span className="tabular">{formatMoney(totalQty(i) * i.cost)}</span> },
  ];

  return (
    <Panel>
      <Toolbar>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips
            label="Filter by stock level"
            value={level}
            onChange={setLevel}
            options={LEVELS.map((f) => ({ key: f, label: LEVEL_LABEL[f], count: state.items.filter((i) => inLevel(i, f) && search(i)).length }))}
          />
          <OptionSelect
            aria-label="Category"
            className="h-8 w-auto rounded-full text-[13px]"
            value={category}
            onChange={setCategory}
            options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
        </div>
        <SearchInput label="Search items" placeholder="Search item name or SKU" value={query} onChange={setQuery} />
      </Toolbar>
      <DataTable columns={columns} rows={rows} rowKey={(i) => i.sku} empty="No items match these filters." />
    </Panel>
  );
}

/* ---------------------------------------------------------------- History */

const MOVES = ["all", "purchase", "sale", "transfer"] as const;
type MoveFilter = (typeof MOVES)[number];
const MOVE_LABEL: Record<MoveFilter, string> = { all: "All", purchase: "Purchase", sale: "Sale", transfer: "Transfer" };
const HISTORY_LIMIT = 60;

const inMove = (m: StockMovement, f: MoveFilter) => f === "all" || m.type.toLowerCase().startsWith(f);

type MovementRow = StockMovement & { key: string };

function HistoryTable({ state }: { state: InventoryState }) {
  const { openDrawer } = useUI();
  const [type, setType] = useUrlFilter<MoveFilter>("type", MOVES, "all");
  const [query, setQuery] = useState("");

  const search = (m: StockMovement) => matches(query, findItem(state, m.sku).name, m.sku, m.ref);
  const rows: MovementRow[] = state.movements
    .map((m, idx) => ({ ...m, key: `${m.at}-${m.ref}-${m.sku}-${m.godownId}-${idx}` }))
    .filter((m) => inMove(m, type) && search(m))
    .slice(0, HISTORY_LIMIT);

  const columns: Column<MovementRow>[] = [
    { key: "when", header: "When", className: "w-[160px]", cell: (m) => <span className="text-muted-foreground">{formatDateTime(m.at)}</span> },
    {
      key: "item",
      header: "Item",
      className: "min-w-[240px]",
      cell: (m) => (
        <>
          <RecordLink onClick={() => openDrawer({ type: "item", sku: m.sku })}>{findItem(state, m.sku).name}</RecordLink>
          <Sub className="tabular">{m.sku}</Sub>
        </>
      ),
    },
    { key: "godown", header: "Godown", className: "w-[110px]", cell: (m) => godown(m.godownId).short },
    { key: "type", header: "Movement", className: "w-[130px]", cell: (m) => <StatusBadge tone={movementTone[m.type]}>{m.type}</StatusBadge> },
    { key: "ref", header: "Reference", className: "w-[120px]", cell: (m) => <span className="tabular text-muted-foreground">{m.ref}</span> },
    {
      key: "qty",
      header: "Qty",
      className: "w-[100px]",
      align: "right",
      cell: (m) => <span className={cn("tabular font-semibold", m.qty > 0 ? "text-success" : "text-danger")}>{formatSigned(m.qty)}</span>,
    },
  ];

  return (
    <Panel>
      <Toolbar>
        <FilterChips
          label="Filter by movement type"
          value={type}
          onChange={setType}
          options={MOVES.map((f) => ({ key: f, label: MOVE_LABEL[f], count: state.movements.filter((m) => inMove(m, f) && search(m)).length }))}
        />
        <SearchInput label="Search stock movements" placeholder="Search item, SKU or reference" value={query} onChange={setQuery} />
      </Toolbar>
      <DataTable columns={columns} rows={rows} rowKey={(m) => m.key} empty="No movements match." />
    </Panel>
  );
}
