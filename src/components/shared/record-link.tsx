import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A record name (item, order) that opens its details. shadcn Button, link variant. */
export function RecordLink({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="link"
      className={cn("h-auto justify-start p-0 text-left font-semibold whitespace-normal text-foreground hover:text-primary", className)}
      {...props}
    />
  );
}
