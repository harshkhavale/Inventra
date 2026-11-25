"use client";

import { SalesBarChart, RankList, type ColumnDatum } from "@/components/shared/charts";
import { Panel, PanelHeader, EmptyNote } from "@/components/shared/panel";
import { StatCard, StatGrid } from "@/components/shared/stat";
import { TODAY } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { addDays, formatCompactMoney, formatDate, formatMoney, formatNumber, percent, plural } from "@/lib/format";
import { findCustomer, findItem, orderTotal, subtotal, totalValue, units } from "@/lib/selectors";
import type { InventoryState } from "@/lib/types";
import { ExportButton } from "./export-button";
import type { Period } from "./reports-view";

/** Daily buckets for 7/30 days, weekly for 90, so the chart stays legible. */
function buckets(state: InventoryState, period: Period): ColumnDatum[] {
  const step = period.days === 90 ? 7 : 1;
  const count = Math.ceil(period.days / step);
  const labelEvery = period.days === 7 ? 1 : period.days === 30 ? 5 : 2;
  return Array.from({ length: count }, (_, k) => {
    const start = addDays(period.since, k * step);
    const end = addDays(start, step - 1);
    const value = totalValue(state.sales.filter((o) => o.date >= start && o.date <= end));
    const label = k % labelEvery !== 0 ? "" : period.days === 30 ? String(parseInt(start.slice(8), 10)) : formatDate(start);
    return {
      key: start,
      value,
      label,
      title: step === 1 ? formatDate(start, true) : `Week of ${formatDate(start)}`,
      highlight: step === 1 && start === TODAY,
    };
  });
}

export function SalesReport({ state, period }: { state: InventoryState; period: Period }) {
  const orders = state.sales.filter((o) => o.date >= period.since);
  const booked = totalValue(orders);
  const collected = totalValue(orders.filter((o) => o.status === "Paid"));
  const unitsSold = state.movements.filter((m) => m.type === "Sale" && m.at.slice(0, 10) >= period.since).reduce((s, m) => s - m.qty, 0);

  const byItem = new Map<string, { value: number; qty: number }>();
  orders.forEach((o) =>
    o.lines.forEach((l) => {
      const cur = byItem.get(l.sku) ?? { value: 0, qty: 0 };
      byItem.set(l.sku, { value: cur.value + l.qty * l.rate, qty: cur.qty + l.qty });
    }),
  );
  const topItems = [...byItem.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 5);

  const byCustomer = new Map<string, { value: number; count: number }>();
  orders.forEach((o) => {
    const cur = byCustomer.get(o.customerId) ?? { value: 0, count: 0 };
    byCustomer.set(o.customerId, { value: cur.value + orderTotal(o.lines), count: cur.count + 1 });
  });
  const topCustomers = [...byCustomer.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 5);

  const exportCsv = () =>
    downloadCsv(
      `sales-register-${period.since}-to-${TODAY}.csv`,
      ["Order", "Date", "Customer", "Invoice", "Status", "Units", "Subtotal", "Total incl. GST"],
      orders.map((o) => [o.id, o.date, findCustomer(state, o.customerId).name, o.invoice, o.status, units(o.lines), subtotal(o.lines), orderTotal(o.lines)]),
    );

  return (
    <>
      <StatGrid min={200}>
        <StatCard label="Sales booked" value={formatCompactMoney(booked)} sub={`${orders.length} orders incl. GST`} />
        <StatCard label="Average order value" value={formatCompactMoney(orders.length ? booked / orders.length : 0)} sub="Per sales order" />
        <StatCard label="Collected" value={formatCompactMoney(collected)} sub={`${Math.round(percent(collected, booked))}% of booked value`} />
        <StatCard label="Units sold" value={formatNumber(unitsSold)} sub="Dispatched from godowns" />
      </StatGrid>

      <Panel>
        <PanelHeader
          title="Sales booked over time"
          description={`${period.days === 90 ? "Weekly" : "Daily"} order value incl. GST · hover a bar for the figure`}
          action={<ExportButton onExport={exportCsv} />}
        />
        <div className="px-5 pt-2 pb-5">
          <SalesBarChart data={buckets(state, period)} height={250} />
        </div>
      </Panel>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" }}>
        <Panel className="pb-3">
          <PanelHeader title="Top items" description="By sales value before GST" />
          {topItems.length === 0 && <EmptyNote>No sales in this period.</EmptyNote>}
          <RankList
            data={topItems.map(([sku, v]) => {
              const item = findItem(state, sku);
              return { key: sku, label: item.name, value: formatMoney(v.value), share: percent(v.value, topItems[0][1].value), sub: `${formatNumber(v.qty)} ${item.unit} sold` };
            })}
          />
        </Panel>
        <Panel className="pb-3">
          <PanelHeader title="Top customers" description="By order value incl. GST" />
          {topCustomers.length === 0 && <EmptyNote>No sales in this period.</EmptyNote>}
          <RankList
            data={topCustomers.map(([id, v]) => ({
              key: id,
              label: findCustomer(state, id).name,
              value: formatMoney(v.value),
              share: percent(v.value, topCustomers[0][1].value),
              sub: plural(v.count, "order"),
            }))}
          />
        </Panel>
      </div>
    </>
  );
}
