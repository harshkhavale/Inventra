import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/status";
import { cn } from "@/lib/utils";

/** shadcn Badge with a leading status dot. */
export function StatusBadge({ tone, children, dot = true, className }: { tone: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <Badge variant={tone} className={cn("gap-1.5 font-semibold", className)}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </Badge>
  );
}
