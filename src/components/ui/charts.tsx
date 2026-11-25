import { cn } from "@/lib/cn";
import { Progress, type Fill } from "./progress";

export interface ColumnDatum {
  key: string;
  value: number;
  label: string;
  tooltip: string;
  highlight?: boolean;
}

/** Simple vertical bar chart. Bars scale to the tallest value. */
export function ColumnChart({ data, height = 210, gap = 6 }: { data: ColumnDatum[]; height?: number; gap?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col" style={{ height }}>
      <div className="flex min-h-0 flex-1 items-end border-b border-line" style={{ gap }}>
        {data.map((d) => {
          const h = d.value ? Math.max(3, (d.value / max) * 100) : 0;
          return (
            <div key={d.key} title={d.tooltip} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
              <span className="sr-only">{d.tooltip}</span>
              <div
                className={cn(
                  "min-h-0.5 rounded-t-[5px] rounded-b-[2px] transition-colors group-hover:bg-brand",
                  d.highlight ? "bg-brand" : "bg-brand-pale",
                )}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden className="flex pt-2" style={{ gap }}>
        {data.map((d) => (
          <div key={d.key} className="tabular min-w-0 flex-1 text-center text-[11px] whitespace-nowrap text-muted">
            {d.label}
          </div>
        ))}
      </div>
    </div>
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

/** Label + value on one line with a meter underneath. */
export function RankList({ data }: { data: RankDatum[] }) {
  return (
    <ul>
      {data.map((d) => (
        <li key={d.key} className="px-5 py-2.5">
          <div className="flex justify-between gap-3 text-[13.5px]">
            <span className="min-w-0 truncate">{d.label}</span>
            <span className="tabular font-semibold">{d.value}</span>
          </div>
          <Progress value={d.share} fill={d.fill} className="mt-[7px]" />
          {d.sub && <div className="mt-0.5 text-[12.5px] text-muted">{d.sub}</div>}
        </li>
      ))}
    </ul>
  );
}

/** Label, meter, value in three columns. */
export function BarRows({ data }: { data: RankDatum[] }) {
  return (
    <ul>
      {data.map((d) => (
        <li key={d.key} className="grid grid-cols-[130px_1fr_96px] items-center gap-3.5 px-5 py-2.5">
          <span className="text-[13.5px]">{d.label}</span>
          <Progress value={d.share} fill={d.fill} className="h-2.5" />
          <span className="tabular justify-self-end font-semibold">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}
