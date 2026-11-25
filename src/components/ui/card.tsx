import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("min-w-0 rounded-[14px] border border-line bg-white", className)} {...props} />;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pt-[18px] pb-3.5", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon}
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
          {subtitle && <div className="mt-0.5 text-[12.5px] text-muted">{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

/** A list row with a hairline divider, used inside cards. */
export function CardRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 border-t border-line-soft px-5 py-[13px]", className)} {...props} />;
}

export function EmptyState({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-8 text-center text-muted", className)}>{children}</div>;
}

export function Sub({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-0.5 text-[12.5px] text-muted", className)} {...props} />;
}
