import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type Fill = "brand" | "soft" | "good" | "warn" | "bad";

const fills: Record<Fill, string> = {
  brand: "bg-primary",
  soft: "bg-chart-5",
  good: "bg-success-fill",
  warn: "bg-warning-fill",
  bad: "bg-destructive",
};

/** shadcn Progress coloured by meaning. `value` is 0–100. */
export function Meter({ value, fill = "brand", className, label }: { value: number; fill?: Fill; className?: string; label?: string }) {
  return <Progress value={value} aria-label={label} className={cn("h-1.5", className)} indicatorClassName={fills[fill]} />;
}
