import Link from "next/link";
import { cn } from "@/lib/cn";

export type TextTone = "muted" | "warn" | "bad";

const textTones: Record<TextTone, string> = {
  muted: "text-muted",
  warn: "text-warn-text",
  bad: "text-bad",
};

export interface StatProps {
  label: string;
  value: string;
  sub: string;
  tone?: TextTone;
}

/** Headline number on the dashboard; the whole tile links to its detail view. */
export function KpiTile({ label, value, sub, tone = "muted", href }: StatProps & { href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-white px-5 py-[18px] text-ink transition hover:border-[#c9cfda] hover:shadow-card-hover"
    >
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span className="tabular text-[28px] font-[650] tracking-[-0.02em]">{value}</span>
      <span className={cn("text-[12.5px]", textTones[tone])}>{sub}</span>
    </Link>
  );
}

/** Smaller summary figure at the top of a module. */
export function StatCard({ label, value, sub, tone = "muted" }: StatProps) {
  return (
    <div className="rounded-[14px] border border-line bg-white px-5 py-4">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="tabular mt-1 text-[22px] font-[650]">{value}</div>
      <div className={cn("mt-0.5 text-[12.5px]", textTones[tone])}>{sub}</div>
    </div>
  );
}

export function StatGrid({ children, min = 220 }: { children: React.ReactNode; min?: number }) {
  return (
    <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}>
      {children}
    </div>
  );
}
