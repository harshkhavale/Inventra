"use client";

import { useUI } from "@/components/providers/ui-provider";
import { RankList } from "@/components/shared/charts";
import { Sub } from "@/components/shared/data-table";
import { Panel, PanelHeader, PanelRow, EmptyNote } from "@/components/shared/panel";
import { RecordLink } from "@/components/shared/record-link";
import { StatCard, StatGrid } from "@/components/shared/stat";
import { StatusBadge } from "@/components/shared/status-badge";
import { TODAY } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { formatCompactMoney, formatDate, formatMoney, formatNumber, percent, plural } from "@/lib/format";
import { byNewest, findSupplier, orderTotal, totalValue, units } from "@/lib/selectors";
import { purchaseBadge } from "@/lib/status";
import type { InventoryState, PurchaseOrder } from "@/lib/types";
import { ExportButton } from "./export-button";
import type { Period } from "./reports-view";

function timing(p: PurchaseOrder) {
  if (p.status === "Pending") return `Expected ${formatDate(p.expected)}`;
  return `${p.receivedOn! <= p.expected ? "Received on time" : "Received late"}, ${formatDate(p.receivedOn)}`;
}

export function PurchaseReport({ state, period }: { state: InventoryState; period: Period }) {
  const { openDrawer } = useUI();
  const orders = state.purchases.filter((p) => p.date >= period.since).sort(byNewest);
  const pending = orders.filter((p) => p.status === "Pending");
  const received = orders.filter((p) => p.status === "Received");
  const onTime = received.filter((p) => p.receivedOn! <= p.expected).length;
  const spend = totalValue(orders);

  const bySupplier = new Map<string, { value: number; count: number }>();
  orders.forEach((p) => {
    const cur = bySupplier.get(p.supplierId) ?? { value: 0, count: 0 };
    bySupplier.set(p.supplierId, { value: cur.value + orderTotal(p.lines), count: cur.count + 1 });
  });
  const ranked = [...bySupplier.entries()].sort((a, b) => b[1].value - a[1].value);

  const exportCsv = () =>
    downloadCsv(
      `purchase-register-${period.since}-to-${TODAY}.csv`,
      ["PO", "Raised", "Supplier", "Status", "Expected", "Received", "Units", "Total incl. GST"],
      orders.map((p) => [p.id, p.date, findSupplier(state, p.supplierId).name, p.status, p.expected, p.receivedOn ?? "", units(p.lines), orderTotal(p.lines)]),
    );

  return (
    <>
      <StatGrid min={150}>
        <StatCard label="Purchases raised" value={formatCompactMoney(spend)} sub={`${orders.length} purchase orders incl. GST`} />
        <StatCard label="Received into stock" value={formatCompactMoney(totalValue(received))} sub={`${formatNumber(received.reduce((s, p) => s + units(p.lines), 0))} units booked in`} />
        <StatCard label="Still pending" value={formatCompactMoney(totalValue(pending))} sub={`${plural(pending.length, "PO")} open`} />
        <StatCard
          label="On-time delivery"
          value={received.length ? `${Math.round((onTime / received.length) * 100)}%` : "—"}
          sub={`${onTime} of ${received.length} received POs`}
        />
      </StatGrid>

      <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" }}>
        <Panel className="pb-3">
          <PanelHeader title="Purchases by supplier" description="PO value incl. GST in the period" />
          {ranked.length === 0 && <EmptyNote>No purchase orders in this period.</EmptyNote>}
          <RankList
            data={ranked.map(([id, v]) => {
              const s = findSupplier(state, id);
              return { key: id, label: s.name, value: formatMoney(v.value), share: percent(v.value, ranked[0][1].value), sub: `${plural(v.count, "PO")} · lead time ${s.leadDays} days` };
            })}
          />
        </Panel>
        <Panel>
          <PanelHeader title="Purchase register" description="Orders raised in the period" action={<ExportButton onExport={exportCsv} />} />
          {orders.length === 0 && <EmptyNote>No purchase orders in this period.</EmptyNote>}
          {orders.map((p) => {
            const b = purchaseBadge(p);
            return (
              <PanelRow key={p.id} className="py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <RecordLink className="tabular" onClick={() => openDrawer({ type: "purchase", id: p.id })}>
                      {p.id}
                    </RecordLink>{" "}
                    <span className="text-muted-foreground">· {findSupplier(state, p.supplierId).name}</span>
                  </div>
                  <Sub>
                    {formatDate(p.date)} · {timing(p)}
                  </Sub>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="tabular font-semibold">{formatMoney(orderTotal(p.lines))}</span>
                  <StatusBadge tone={b.tone}>{b.label}</StatusBadge>
                </div>
              </PanelRow>
            );
          })}
        </Panel>
      </div>
    </>
  );
}
