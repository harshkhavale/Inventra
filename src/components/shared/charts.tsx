"use client";

import { Suspense, use } from "react";
import { browser } from "react-dom";
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { Meter, type Fill } from "./meter";

export interface ColumnDatum {
  key: string;
  value: number;
  /** Axis label; empty string hides it. */
  label: string;
  /** Shown as the tooltip heading. */
  title: string;
  highlight?: boolean;
}

const salesConfig = {
  value: { label: "Sales", color: "var(--chart-2)" },
} satisfies ChartConfig;

/**
 * Money-over-time bar chart. shadcn Chart (Recharts), today's bar highlighted.
 * Rendered in the browser only: Recharts measures its container and
 * generates random ids, neither of which can happen during prerender.
 */
export function SalesBarChart(props: { data: ColumnDatum[]; height?: number }) {
  return (
    <Suspense fallback={<Skeleton className="w-full" style={{ height: props.height ?? 210 }} />}>
      <BrowserBarChart {...props} />
    </Suspense>
  );
}

function BrowserBarChart({ data, height = 210 }: { data: ColumnDatum[]; height?: number }) {
  use(browser("Recharts measures the DOM and generates random ids."));
  return (
    <ChartContainer config={salesConfig} className="w-full" style={{ height }}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="key" tickLine={false} axisLine={false} tickMargin={8} interval={0} tickFormatter={(_, i) => data[i]?.label ?? ""} fontSize={11} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) => payload?.[0]?.payload?.title}
              formatter={(v) => <span className="tabular font-semibold">{formatMoney(Number(v))}</span>}
            />
          }
        />
        <Bar dataKey="value" radius={[5, 5, 2, 2]} minPointSize={2}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.highlight ? "var(--chart-1)" : "var(--color-value)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export interface RankDatum {
  key: string;
  label: string;
  value: string;
  /** 0–100 */
  share: number;
  sub?: string;
  fill?: Fill;
}

/** Label and value on one line with a meter underneath. */
export function RankList({ data }: { data: RankDatum[] }) {
  return (
    <ul className="pb-3">
      {data.map((d) => (
        <li key={d.key} className="px-5 py-2.5">
          <div className="flex justify-between gap-3 text-[13.5px]">
            <span className="min-w-0 truncate">{d.label}</span>
            <span className="tabular font-semibold">{d.value}</span>
          </div>
          <Meter value={d.share} fill={d.fill} className="mt-2" label={d.label} />
          {d.sub && <div className="mt-1 text-[12.5px] text-muted-foreground">{d.sub}</div>}
        </li>
      ))}
    </ul>
  );
}

/** Label, meter, value in three columns. */
export function BarRows({ data }: { data: RankDatum[] }) {
  return (
    <ul className="pb-3">
      {data.map((d) => (
        <li key={d.key} className="grid grid-cols-[minmax(0,110px)_1fr_80px] items-center gap-3 px-5 py-2.5 sm:grid-cols-[130px_1fr_96px] sm:gap-3.5">
          <span className="text-[13.5px]">{d.label}</span>
          <Meter value={d.share} fill={d.fill} className="h-2.5" label={d.label} />
          <span className="tabular justify-self-end font-semibold">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}
