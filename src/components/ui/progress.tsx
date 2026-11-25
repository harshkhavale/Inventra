import { cn } from "@/lib/cn";

export type Fill = "brand" | "soft" | "good" | "warn" | "bad";

const fills: Record<Fill, string> = {
  brand: "bg-brand",
  soft: "bg-brand-muted",
  good: "bg-good-fill",
  warn: "bg-warn-fill",
  bad: "bg-bad-fill",
};

/** Horizontal meter. `value` is a 0–100 percentage. */
export function Progress({ value, fill = "brand", className }: { value: number; fill?: Fill; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-track", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", fills[fill])} style={{ width: `${value}%` }} />
    </div>
  );
}
