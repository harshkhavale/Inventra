import Link from "next/link";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type TextTone = "muted" | "warn" | "bad";

const textTones: Record<TextTone, string> = {
  muted: "text-muted-foreground",
  warn: "text-warning-fill",
  bad: "text-danger",
};

export interface StatProps {
  label: string;
  value: string;
  sub: string;
  tone?: TextTone;
}

function StatBody({ label, value, sub, tone = "muted", large }: StatProps & { large?: boolean }) {
  return (
    <>
      <CardHeader className="px-5">
        <CardDescription className="text-[13px] font-medium">{label}</CardDescription>
        <CardTitle className={cn("tabular font-semibold tracking-tight", large ? "text-[28px]" : "text-[22px]")}>{value}</CardTitle>
      </CardHeader>
      <CardFooter className="px-5">
        <span className={cn("text-[12.5px]", textTones[tone])}>{sub}</span>
      </CardFooter>
    </>
  );
}

/** Headline number on the dashboard; the whole card links to its filtered view. */
export function KpiTile({ href, ...stat }: StatProps & { href: string }) {
  return (
    <Link href={href} className="group rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <Card className="h-full gap-1.5 py-5 transition group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
        <StatBody {...stat} large />
      </Card>
    </Link>
  );
}

/** Summary figure at the top of a module. */
export function StatCard(stat: StatProps) {
  return (
    <Card className="gap-1 py-4">
      <StatBody {...stat} />
    </Card>
  );
}

export function StatGrid({ children, min = 220 }: { children: React.ReactNode; min?: number }) {
  return (
    <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}>
      {children}
    </div>
  );
}
