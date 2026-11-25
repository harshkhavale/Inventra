import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/status";

const tones: Record<Tone, string> = {
  green: "bg-good-bg text-good",
  amber: "bg-warn-bg text-warn",
  red: "bg-bad-bg text-bad",
  blue: "bg-info-bg text-info",
  gray: "bg-[#f0f2f5] text-[#475467]",
};

export function Badge({ tone, children, dot = true, className }: { tone: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
