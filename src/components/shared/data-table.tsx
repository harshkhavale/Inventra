import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Tailwind width/min-width classes for the column, e.g. "w-[120px]". */
  className?: string;
  align?: "left" | "right";
  /**
   * Placement in the phone card layout. By default the first column is the
   * card title, an "actions" column goes to the footer, and every other
   * column becomes a label/value pair.
   */
  mobile?: "title" | "aside" | "footer" | "hide";
  cell: (row: T) => React.ReactNode;
}

function placement<T>(c: Column<T>, index: number): NonNullable<Column<T>["mobile"]> | "field" {
  if (c.mobile) return c.mobile;
  if (index === 0) return "title";
  if (c.key === "actions") return "footer";
  return "field";
}

/**
 * Column-driven list on top of shadcn's Table. From the md breakpoint up it
 * is a table; on phones each row becomes a card, so nothing is squeezed.
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
  const by = (kind: string) => columns.filter((c, i) => placement(c, i) === kind);
  const [title, aside, fields, footer] = [by("title"), by("aside"), by("field"), by("footer")];

  if (rows.length === 0) {
    return <div className="border-t py-10 text-center text-muted-foreground">{empty}</div>;
  }

  return (
    <>
      {/* Phones: one card per row */}
      <ul className="divide-y md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">{title.map((c) => <div key={c.key}>{c.cell(row)}</div>)}</div>
              {aside.length > 0 && (
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  {aside.map((c) => (
                    <div key={c.key}>{c.cell(row)}</div>
                  ))}
                </div>
              )}
            </div>
            {fields.length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13.5px]">
                {fields.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{c.header}</dt>
                    <dd className="mt-0.5">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {footer.length > 0 && (
              <div className="mt-3.5 flex justify-end gap-2">
                {footer.map((c) => (
                  <div key={c.key}>{c.cell(row)}</div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Tablet and up: table */}
      <div className="hidden md:block">
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
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/** Secondary line under a cell's main value. */
export function Sub({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-0.5 text-[12.5px] text-muted-foreground", className)} {...props} />;
}
