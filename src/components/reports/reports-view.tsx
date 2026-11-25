"use client";

import { ViewTabs } from "@/components/shared/filters";
import { PageHeader } from "@/components/shared/page-header";
import { useUrlFilter } from "@/hooks/use-url-filter";
import { TODAY } from "@/lib/constants";
import { addDays, formatDate } from "@/lib/format";
import { useInventory } from "@/store/inventory-store";
import { PurchaseReport } from "./purchase-report";
import { SalesReport } from "./sales-report";
import { StockReport } from "./stock-report";

const REPORTS = ["stock", "sales", "purchase"] as const;
type Report = (typeof REPORTS)[number];
const RANGES = ["7", "30", "90"] as const;
type Range = (typeof RANGES)[number];

export interface Period {
  days: number;
  since: string;
}

export function ReportsView() {
  const state = useInventory();
  const [report, setReport] = useUrlFilter<Report>("report", REPORTS, "stock");
  const [range, setRange] = useUrlFilter<Range>("range", RANGES, "30");
  const days = Number(range);
  const period: Period = { days, since: addDays(TODAY, -(days - 1)) };
  const span = `${formatDate(period.since)} – ${formatDate(TODAY)}`;

  const notes: Record<Report, string> = {
    stock: "Valuation and movement across every godown.",
    sales: `Order value, best sellers and top customers for ${span}.`,
    purchase: `Supplier spend and delivery performance for ${span}.`,
  };

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description={notes[report]}
        actions={
          <>
            <ViewTabs
              label="Report"
              value={report}
              onChange={setReport}
              options={[
                { key: "stock", label: "Stock" },
                { key: "sales", label: "Sales" },
                { key: "purchase", label: "Purchase" },
              ]}
            />
            <ViewTabs
              label="Date range"
              value={range}
              onChange={setRange}
              options={RANGES.map((r) => ({ key: r, label: `${r} days` }))}
            />
          </>
        }
      />
      {report === "stock" && <StockReport state={state} period={period} />}
      {report === "sales" && <SalesReport state={state} period={period} />}
      {report === "purchase" && <PurchaseReport state={state} period={period} />}
    </>
  );
}
