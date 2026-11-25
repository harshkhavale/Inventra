"use client";

import { useState } from "react";
import { useUI } from "@/components/providers/ui-provider";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, Sub } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Select } from "@/components/ui/field";
import { FilterChips, SearchInput, Segmented, Toolbar } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { matches, useUrlFilter } from "@/hooks/use-url-filter";
import { CATEGORIES, godown, GODOWNS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { formatCompactMoney, formatDateTime, formatMoney, formatNumber, formatSigned } from "@/lib/format";
import { findItem, stockLevel, stockValue, totalQty } from "@/lib/selectors";
import { movementTone, stockBadge } from "@/lib/status";
import type { Category, InventoryState, Item, StockMovement } from "@/lib/types";
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
          <Segmented
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
      width: "minmax(220px, 2fr)",
      cell: (i) => (
        <>
          <LinkButton onClick={() => openDrawer({ type: "item", sku: i.sku })}>{i.name}</LinkButton>
          <Sub className="tabular">
            {i.sku} · per {i.unit}
          </Sub>
        </>
      ),
    },
    { key: "cat", header: "Category", width: "120px", cell: (i) => <span className="text-muted">{i.category}</span> },
    ...GODOWNS.map<Column<Item>>((g) => ({
      key: g.id,
      header: g.short,
      width: "80px",
      align: "right",
      cell: (i) => <span className={cn("tabular", i.stock[g.id] === 0 && "text-faint")}>{formatNumber(i.stock[g.id])}</span>,
    })),
    { key: "total", header: "Total", width: "80px", align: "right", cell: (i) => <span className="tabular font-[650]">{formatNumber(totalQty(i))}</span> },
    { key: "min", header: "Min", width: "60px", align: "right", cell: (i) => <span className="tabular text-muted">{formatNumber(i.minLevel)}</span> },
    {
      key: "status",
      header: "Status",
      width: "120px",
      cell: (i) => {
        const b = stockBadge[stockLevel(i)];
        return <Badge tone={b.tone}>{b.label}</Badge>;
      },
    },
    { key: "value", header: "Value", width: "110px", align: "right", cell: (i) => <span className="tabular">{formatMoney(totalQty(i) * i.cost)}</span> },
  ];

  return (
    <Card>
      <Toolbar>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips
            label="Filter by stock level"
            value={level}
            onChange={setLevel}
            options={LEVELS.map((f) => ({ key: f, label: LEVEL_LABEL[f], count: state.items.filter((i) => inLevel(i, f) && search(i)).length }))}
          />
          <Select
            aria-label="Category"
            className="min-h-[34px] w-auto rounded-full text-[13px]"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "all")}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <SearchInput label="Search items" placeholder="Search item name or SKU" value={query} onChange={setQuery} />
      </Toolbar>
      <DataTable columns={columns} rows={rows} rowKey={(i) => i.sku} empty="No items match these filters." />
    </Card>
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
    { key: "when", header: "When", width: "160px", cell: (m) => <span className="text-muted">{formatDateTime(m.at)}</span> },
    {
      key: "item",
      header: "Item",
      width: "minmax(240px, 2fr)",
      cell: (m) => (
        <>
          <LinkButton onClick={() => openDrawer({ type: "item", sku: m.sku })}>{findItem(state, m.sku).name}</LinkButton>
          <Sub className="tabular">{m.sku}</Sub>
        </>
      ),
    },
    { key: "godown", header: "Godown", width: "110px", cell: (m) => godown(m.godownId).short },
    { key: "type", header: "Movement", width: "130px", cell: (m) => <Badge tone={movementTone[m.type]}>{m.type}</Badge> },
    { key: "ref", header: "Reference", width: "120px", cell: (m) => <span className="tabular text-muted">{m.ref}</span> },
    {
      key: "qty",
      header: "Qty",
      width: "100px",
      align: "right",
      cell: (m) => <span className={cn("tabular font-semibold", m.qty > 0 ? "text-good" : "text-bad")}>{formatSigned(m.qty)}</span>,
    },
  ];

  return (
    <Card>
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
    </Card>
  );
}
