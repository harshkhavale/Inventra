"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { ColumnChart } from "@/components/ui/charts";
import { Progress } from "@/components/ui/progress";
import { KpiTile, StatGrid } from "@/components/ui/stat";
import { GODOWNS, TODAY } from "@/lib/constants";
import { addDays, formatCompactMoney, formatDate, formatMoney, formatNumber, percent } from "@/lib/format";
import {
  confirmedSales,
  isOverdue,
  lowStockItems,
  orderTotal,
  pendingPurchases,
  stockValue,
  totalQty,
  totalValue,
} from "@/lib/selectors";
import type { InventoryState } from "@/lib/types";
import { useInventory } from "@/store/inventory-store";
import { ActivityFeed, DispatchQueue, IncomingPurchases, LowStockAlerts } from "./dashboard-lists";

export function DashboardView() {
  const state = useInventory();
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-muted uppercase">Welcome back, Arjun</p>
          <h1 className="text-[26px] leading-tight font-[650] tracking-[-0.02em]">Here’s where your stock stands today</h1>
        </div>
        <p className="text-[13.5px] text-muted">Every sale, receipt and transfer updates these numbers instantly.</p>
      </header>

      <Kpis state={state} />

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))" }}>
        <SalesTrend state={state} />
        <LowStockAlerts state={state} />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}>
        <DispatchQueue state={state} />
        <IncomingPurchases state={state} />
        <ActivityFeed state={state} />
      </div>
    </>
  );
}

function Kpis({ state }: { state: InventoryState }) {
  const low = lowStockItems(state);
  const out = low.filter((i) => totalQty(i) === 0).length;
  const confirmed = confirmedSales(state);
  const pending = pendingPurchases(state);
  const overdue = pending.filter(isOverdue).length;
  const month = state.sales.filter((o) => o.date.slice(0, 7) === TODAY.slice(0, 7));
  const toCollect = totalValue(state.sales.filter((o) => o.status === "Dispatched"));
  const units = state.items.reduce((s, i) => s + totalQty(i), 0);

  return (
    <StatGrid min={200}>
      <KpiTile href="/stock" label="Stock value at cost" value={formatCompactMoney(stockValue(state.items))} sub={`${formatNumber(units)} units in ${GODOWNS.length} godowns`} />
      <KpiTile
        href="/stock?status=low"
        label="Items below minimum"
        value={String(low.length)}
        sub={out ? `${out} out of stock` : "None out of stock"}
        tone={out ? "bad" : "muted"}
      />
      <KpiTile
        href="/sales"
        label="Sales booked in November"
        value={formatCompactMoney(totalValue(month))}
        sub={`${month.length} orders · ${formatCompactMoney(toCollect)} to collect`}
      />
      <KpiTile href="/sales?status=confirmed" label="Orders to dispatch" value={String(confirmed.length)} sub={`${formatCompactMoney(totalValue(confirmed))} ready to ship`} />
      <KpiTile
        href="/purchases?status=pending"
        label="Purchase orders pending"
        value={String(pending.length)}
        sub={formatCompactMoney(totalValue(pending)) + (overdue ? ` · ${overdue} overdue` : " on order")}
        tone={overdue ? "warn" : "muted"}
      />
    </StatGrid>
  );
}

function SalesTrend({ state }: { state: InventoryState }) {
  const days = Array.from({ length: 14 }, (_, k) => addDays(TODAY, k - 13));
  const values = days.map((d) => state.sales.filter((o) => o.date === d).reduce((s, o) => s + orderTotal(o.lines), 0));
  const total = values.reduce((a, b) => a + b, 0);
  const orders = state.sales.filter((o) => o.date >= days[0]).length;

  const invValue = stockValue(state.items);
  const byGodown = GODOWNS.map((g) => ({ g, value: state.items.reduce((s, i) => s + i.stock[g.id] * i.cost, 0) }));

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Sales booked · last 14 days"
        subtitle={`Order value incl. GST · peak day ${formatCompactMoney(Math.max(...values))}`}
        action={
          <div className="text-right">
            <div className="tabular text-xl font-[650] whitespace-nowrap">{formatCompactMoney(total)}</div>
            <div className="mt-0.5 text-[12.5px] text-muted">{orders} orders</div>
          </div>
        }
      />
      <div className="px-5 pt-2">
        <ColumnChart
          data={days.map((d, k) => ({
            key: d,
            value: values[k],
            label: String(parseInt(d.slice(8), 10)),
            tooltip: `${formatDate(d)} · ${formatMoney(values[k])}`,
            highlight: d === TODAY,
          }))}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line-soft px-5 pt-[18px] pb-5">
        {byGodown.map(({ g, value }) => (
          <div key={g.id} className="min-w-0">
            <div className="truncate text-[12.5px] text-muted">{g.name}</div>
            <div className="tabular mt-1 mb-2 text-base font-[650]">{formatCompactMoney(value)}</div>
            <Progress value={percent(value, invValue)} />
            <div className="mt-0.5 text-[12.5px] text-muted">{Math.round(percent(value, invValue))}% of stock value</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
