"use client";

import { useState } from "react";
import { Card, Sub } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { SearchInput, Segmented, Toolbar } from "@/components/ui/filters";
import { PageHeader } from "@/components/ui/page-header";
import { matches } from "@/hooks/use-url-filter";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney, initials } from "@/lib/format";
import { pendingPurchases, totalValue } from "@/lib/selectors";
import type { Customer, InventoryState, Supplier } from "@/lib/types";
import { useInventory } from "@/store/inventory-store";

type Tab = "customers" | "suppliers";

const searchParty = (q: string, p: Customer) => matches(q, p.name, p.city, p.gstin, p.contact);

function Avatar({ name, tone }: { name: string; tone: "blue" | "gray" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-[34px] shrink-0 items-center justify-center rounded-[10px] text-[12.5px] font-bold",
        tone === "blue" ? "bg-info-bg text-info" : "bg-[#f0f2f5] text-body",
      )}
    >
      {initials(name)}
    </span>
  );
}

function contactColumns<T extends Customer>(): Column<T>[] {
  return [
    {
      key: "contact",
      header: "Contact",
      width: "180px",
      cell: (c) => (
        <>
          <div>{c.contact}</div>
          <Sub className="tabular">{c.phone}</Sub>
        </>
      ),
    },
    { key: "gst", header: "GSTIN", width: "170px", cell: (c) => <span className="tabular text-[13px] text-muted">{c.gstin}</span> },
  ];
}

export function DirectoryView() {
  const state = useInventory();
  const [tab, setTab] = useState<Tab>("customers");
  const [query, setQuery] = useState("");

  const receivable = totalValue(state.sales.filter((o) => o.status === "Dispatched"));
  const onOrder = totalValue(pendingPurchases(state));

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Customers & suppliers"
        description="Balances are calculated live from orders and invoices."
        actions={
          <Segmented
            label="Party type"
            value={tab}
            onChange={setTab}
            options={[
              { key: "customers", label: `Customers · ${state.customers.length}` },
              { key: "suppliers", label: `Suppliers · ${state.suppliers.length}` },
            ]}
          />
        }
      />
      <Card>
        <Toolbar>
          <div className="text-[12.5px] text-muted">
            {tab === "customers" ? `${formatMoney(receivable)} receivable from customers` : `${formatMoney(onOrder)} on order with suppliers`}
          </div>
          <SearchInput label="Search parties" placeholder="Search name, city or GSTIN" value={query} onChange={setQuery} />
        </Toolbar>
        {tab === "customers" ? <CustomersTable state={state} query={query} /> : <SuppliersTable state={state} query={query} />}
      </Card>
    </>
  );
}

function CustomersTable({ state, query }: { state: InventoryState; query: string }) {
  const rows = state.customers
    .filter((c) => searchParty(query, c))
    .map((c) => {
      const orders = state.sales.filter((o) => o.customerId === c.id);
      return {
        ...c,
        orders: orders.length,
        billed: totalValue(orders.filter((o) => o.status !== "Confirmed")),
        outstanding: totalValue(orders.filter((o) => o.status === "Dispatched")),
        last: orders.map((o) => o.date).sort().pop(),
      };
    });
  type Row = (typeof rows)[number];

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Customer",
      width: "minmax(220px, 1.6fr)",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} tone="blue" />
          <div className="min-w-0">
            <div className="font-semibold">{c.name}</div>
            <Sub>{c.city}</Sub>
          </div>
        </div>
      ),
    },
    ...contactColumns<Row>(),
    { key: "orders", header: "Orders", width: "70px", align: "right", cell: (c) => <span className="tabular">{c.orders}</span> },
    { key: "billed", header: "Billed", width: "120px", align: "right", cell: (c) => <span className="tabular">{formatMoney(c.billed)}</span> },
    {
      key: "out",
      header: "Outstanding",
      width: "130px",
      align: "right",
      cell: (c) => <span className={cn("tabular", c.outstanding ? "font-semibold text-warn-text" : "text-muted")}>{c.outstanding ? formatMoney(c.outstanding) : "—"}</span>,
    },
    { key: "last", header: "Last order", width: "110px", align: "right", cell: (c) => <span className="text-muted">{formatDate(c.last)}</span> },
  ];

  return <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} empty="Nobody matches that search." />;
}

function SuppliersTable({ state, query }: { state: InventoryState; query: string }) {
  const rows = state.suppliers
    .filter((s) => searchParty(query, s))
    .map((s: Supplier) => {
      const orders = state.purchases.filter((p) => p.supplierId === s.id);
      const categories = [...new Set(state.items.filter((i) => i.supplierId === s.id).map((i) => i.category))];
      return {
        ...s,
        categories: categories.join(", "),
        orders: orders.length,
        purchased: totalValue(orders.filter((p) => p.status === "Received")),
        onOrder: totalValue(orders.filter((p) => p.status === "Pending")),
      };
    });
  type Row = (typeof rows)[number];

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Supplier",
      width: "minmax(220px, 1.6fr)",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} tone="gray" />
          <div className="min-w-0">
            <div className="font-semibold">{s.name}</div>
            <Sub>
              {s.city} · {s.categories}
            </Sub>
          </div>
        </div>
      ),
    },
    ...contactColumns<Row>(),
    { key: "orders", header: "POs", width: "70px", align: "right", cell: (s) => <span className="tabular">{s.orders}</span> },
    { key: "purchased", header: "Purchased", width: "120px", align: "right", cell: (s) => <span className="tabular">{formatMoney(s.purchased)}</span> },
    { key: "on", header: "On order", width: "130px", align: "right", cell: (s) => <span className={cn("tabular", !s.onOrder && "text-muted")}>{s.onOrder ? formatMoney(s.onOrder) : "—"}</span> },
    { key: "lead", header: "Lead time", width: "110px", align: "right", cell: (s) => <span className="text-muted">{s.leadDays} days</span> },
  ];

  return <DataTable columns={columns} rows={rows} rowKey={(s) => s.id} empty="Nobody matches that search." />;
}
