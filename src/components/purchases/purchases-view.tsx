"use client";

import { useState } from "react";
import { useUI } from "@/components/providers/ui-provider";
import { DataTable, Sub, type Column } from "@/components/shared/data-table";
import { FilterChips, SearchInput, Toolbar } from "@/components/shared/filters";
import { Panel } from "@/components/shared/panel";
import { RecordLink } from "@/components/shared/record-link";
import { StatCard, StatGrid } from "@/components/shared/stat";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useCommands } from "@/hooks/use-commands";
import { matches, useUrlFilter } from "@/hooks/use-url-filter";
import { godown, TODAY } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { byNewest, findItem, findSupplier, isOverdue, linesSummary, orderTotal, pendingPurchases, totalValue } from "@/lib/selectors";
import { purchaseBadge } from "@/lib/status";
import type { PurchaseOrder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useInventory } from "@/store/inventory-store";

const FILTERS = ["all", "pending", "overdue", "received"] as const;
type Filter = (typeof FILTERS)[number];
const LABEL: Record<Filter, string> = { all: "All", pending: "Pending", overdue: "Overdue", received: "Received" };

function inFilter(p: PurchaseOrder, f: Filter) {
  if (f === "all") return true;
  if (f === "overdue") return isOverdue(p);
  return p.status === LABEL[f];
}

export function PurchasesView() {
  const state = useInventory();
  const { openDrawer } = useUI();
  const { receivePurchase } = useCommands();
  const [filter, setFilter] = useUrlFilter<Filter>("status", FILTERS, "all");
  const [query, setQuery] = useState("");

  const search = (p: PurchaseOrder) =>
    matches(query, p.id, findSupplier(state, p.supplierId).name, ...p.lines.map((l) => `${l.sku} ${findItem(state, l.sku).name}`));
  const rows = state.purchases.filter((p) => inFilter(p, filter) && search(p)).sort(byNewest);

  const pending = pendingPurchases(state);
  const overdue = pending.filter(isOverdue).length;
  const receivedThisMonth = totalValue(state.purchases.filter((p) => p.receivedOn?.slice(0, 7) === TODAY.slice(0, 7)));

  const columns: Column<PurchaseOrder>[] = [
    {
      key: "id",
      header: "PO",
      className: "w-[110px]",
      cell: (p) => (
        <>
          <RecordLink className="tabular" onClick={() => openDrawer({ type: "purchase", id: p.id })}>
            {p.id}
          </RecordLink>
          <Sub>{formatDate(p.date, true)}</Sub>
        </>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      className: "min-w-[180px]",
      cell: (p) => {
        const s = findSupplier(state, p.supplierId);
        return (
          <>
            <div className="font-medium">{s.name}</div>
            <Sub>{s.city}</Sub>
          </>
        );
      },
    },
    { key: "godown", header: "Deliver to", className: "w-[90px]", cell: (p) => godown(p.godownId).short },
    { key: "items", header: "Items", className: "w-[150px] whitespace-nowrap", cell: (p) => <span className="text-muted-foreground">{linesSummary(p.lines)}</span> },
    { key: "amount", header: "Amount", className: "w-[110px]", align: "right", cell: (p) => <span className="tabular font-semibold">{formatMoney(orderTotal(p.lines))}</span> },
    {
      key: "expected",
      header: "Expected",
      className: "w-[125px]",
      cell: (p) => {
        const late = isOverdue(p);
        if (p.status === "Received") {
          return (
            <>
              <div>{formatDate(p.receivedOn)}</div>
              <Sub>{p.receivedOn! <= p.expected ? "Received on time" : "Received late"}</Sub>
            </>
          );
        }
        return (
          <>
            <div className={cn(late && "text-danger")}>{formatDate(p.expected)}</div>
            <Sub>{late ? "Past expected date" : "Expected"}</Sub>
          </>
        );
      },
    },
    {
      key: "status", mobile: "aside",
      header: "Status",
      className: "w-[100px]",
      cell: (p) => {
        const b = purchaseBadge(p);
        return <StatusBadge tone={b.tone}>{b.label}</StatusBadge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-[140px]",
      align: "right",
      cell: (p) => (
        <div className="flex justify-end gap-1.5">
          {p.status === "Pending" && (
            <Button size="sm" onClick={() => receivePurchase(p.id)}>
              Receive
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => openDrawer({ type: "purchase", id: p.id })}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <StatGrid>
        <StatCard label="On order" value={formatMoney(totalValue(pending))} sub={`${pending.length} pending purchase orders`} />
        <StatCard
          label="Overdue deliveries"
          value={String(overdue)}
          sub={overdue ? "Follow up with suppliers" : "All deliveries on schedule"}
          tone={overdue ? "bad" : "muted"}
        />
        <StatCard label="Received in November" value={formatMoney(receivedThisMonth)} sub="Goods booked into stock" />
      </StatGrid>

      <Panel>
        <Toolbar>
          <FilterChips
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={FILTERS.map((f) => ({ key: f, label: LABEL[f], count: state.purchases.filter((p) => inFilter(p, f) && search(p)).length }))}
          />
          <SearchInput label="Search purchase orders" placeholder="Search PO, supplier or item" value={query} onChange={setQuery} />
        </Toolbar>
        <DataTable columns={columns} rows={rows} rowKey={(p) => p.id} empty="No purchase orders match these filters." />
      </Panel>
    </>
  );
}
