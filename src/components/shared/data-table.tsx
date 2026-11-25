import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Tailwind width/min-width classes for the column, e.g. "w-[120px]". */
  className?: string;
  align?: "left" | "right";
  cell: (row: T) => React.ReactNode;
}

/**
 * Column-driven table on top of shadcn's Table. The shadcn Table already
 * scrolls horizontally inside its container on narrow screens.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty: React.ReactNode;
}) {
  const align = (c: Column<T>) => c.align === "right" && "text-right";
  return (
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => (
            <TableHead
              key={c.key}
              className={cn("h-10 px-3 text-[11.5px] font-semibold tracking-wider text-muted-foreground uppercase first:pl-5 last:pr-5", align(c), c.className)}
            >
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={rowKey(row)}>
            {columns.map((c) => (
              <TableCell key={c.key} className={cn("px-3 py-3 whitespace-normal first:pl-5 last:pr-5", align(c), c.className)}>
                {c.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
              {empty}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

/** Secondary line under a cell's main value. */
export function Sub({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-0.5 text-[12.5px] text-muted-foreground", className)} {...props} />;
}
