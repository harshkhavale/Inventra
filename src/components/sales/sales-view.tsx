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
import { byNewest, confirmedSales, findCustomer, linesSummary, orderTotal, totalValue } from "@/lib/selectors";
import { saleTone } from "@/lib/status";
import type { SalesOrder, SaleStatus } from "@/lib/types";
import { useInventory } from "@/store/inventory-store";

const FILTERS = ["all", "confirmed", "dispatched", "paid"] as const;
type Filter = (typeof FILTERS)[number];
const STATUS: Record<Exclude<Filter, "all">, SaleStatus> = { confirmed: "Confirmed", dispatched: "Dispatched", paid: "Paid" };

export function SalesView() {
  const state = useInventory();
  const { openDrawer } = useUI();
  const { dispatchSale, markSalePaid } = useCommands();
  const [filter, setFilter] = useUrlFilter<Filter>("status", FILTERS, "all");
  const [query, setQuery] = useState("");

  const search = (o: SalesOrder) => matches(query, o.id, o.invoice, findCustomer(state, o.customerId).name);
  const inFilter = (o: SalesOrder, f: Filter) => f === "all" || o.status === STATUS[f];
  const rows = state.sales.filter((o) => inFilter(o, filter) && search(o)).sort(byNewest);

  const confirmed = confirmedSales(state);
  const dispatched = state.sales.filter((o) => o.status === "Dispatched");
  const collected = totalValue(state.sales.filter((o) => o.status === "Paid" && o.paidOn?.slice(0, 7) === TODAY.slice(0, 7)));

  const columns: Column<SalesOrder>[] = [
    {
      key: "id",
      header: "Order",
      className: "w-[120px]",
      cell: (o) => (
        <>
          <RecordLink className="tabular" onClick={() => openDrawer({ type: "sale", id: o.id })}>
            {o.id}
          </RecordLink>
          <Sub>{formatDate(o.date, true)}</Sub>
        </>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      className: "min-w-[200px]",
      cell: (o) => {
        const c = findCustomer(state, o.customerId);
        return (
          <>
            <div className="font-medium">{c.name}</div>
            <Sub>{c.city}</Sub>
          </>
        );
      },
    },
    { key: "godown", header: "Godown", className: "w-[100px]", cell: (o) => godown(o.godownId).short },
    { key: "items", header: "Items", className: "w-[150px] whitespace-nowrap", cell: (o) => <span className="text-muted-foreground">{linesSummary(o.lines)}</span> },
    { key: "amount", header: "Amount", className: "w-[120px]", align: "right", cell: (o) => <span className="tabular font-semibold">{formatMoney(orderTotal(o.lines))}</span> },
    {
      key: "status", mobile: "aside",
      header: "Status",
      className: "w-[150px]",
      cell: (o) => (
        <>
          <StatusBadge tone={saleTone[o.status]}>{o.status}</StatusBadge>
          <Sub className="tabular">{o.invoice || "Not invoiced"}</Sub>
        </>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-[170px]",
      align: "right",
      cell: (o) => (
        <div className="flex justify-end gap-1.5">
          {o.status === "Confirmed" && (
            <Button size="sm" onClick={() => dispatchSale(o.id)}>
              Dispatch
            </Button>
          )}
          {o.status === "Dispatched" && (
            <Button variant="outline" size="sm" onClick={() => markSalePaid(o.id)}>
              Mark paid
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => openDrawer({ type: "sale", id: o.id })}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <StatGrid>
        <StatCard label="Awaiting dispatch" value={formatMoney(totalValue(confirmed))} sub={`${confirmed.length} confirmed orders`} />
        <StatCard label="Invoiced, not yet paid" value={formatMoney(totalValue(dispatched))} sub={`${dispatched.length} invoices outstanding`} />
        <StatCard label="Collected in November" value={formatMoney(collected)} sub="Payments recorded this month" />
      </StatGrid>

      <Panel>
        <Toolbar>
          <FilterChips
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={FILTERS.map((f) => ({
              key: f,
              label: f === "all" ? "All" : STATUS[f],
              count: state.sales.filter((o) => inFilter(o, f) && search(o)).length,
            }))}
          />
          <SearchInput label="Search sales orders" placeholder="Search order, invoice or customer" value={query} onChange={setQuery} />
        </Toolbar>
        <DataTable columns={columns} rows={rows} rowKey={(o) => o.id} empty="No orders match these filters." />
      </Panel>
    </>
  );
}
