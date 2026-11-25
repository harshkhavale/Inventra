import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A shadcn Card laid out for lists and tables: no vertical padding, so rows
 * and tables can run edge to edge with hairline dividers.
 */
export function Panel({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn("min-w-0 gap-0 overflow-hidden py-0", className)} {...props} />;
}

export function PanelHeader({
  title,
  description,
  icon,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <CardHeader className="px-5 pt-5 pb-4">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon}
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="text-[12.5px]">{description}</CardDescription>}
        </div>
      </div>
      {action && <CardAction>{action}</CardAction>}
    </CardHeader>
  );
}

/** A list row inside a Panel. */
export function PanelRow({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-3 border-t px-5 py-3", className)} {...props} />;
}

export function EmptyNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("border-t px-5 py-8 text-center text-muted-foreground", className)}>{children}</div>;
}
