import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** A CSS grid track, e.g. "120px" or "minmax(200px, 1.5fr)". */
  width: string;
  align?: "left" | "right";
  className?: string;
  cell: (row: T) => React.ReactNode;
}

const GAP = 12;
const PADDING_X = 40;

/** Smallest width the columns need: the px floor of each track plus gaps and padding. */
function minWidthOf(widths: string[]): number {
  const floors = widths.map((w) => parseInt(w.match(/(\d+)px/)?.[1] ?? "0", 10));
  return floors.reduce((a, b) => a + b, 0) + GAP * (widths.length - 1) + PADDING_X;
}

/**
 * Grid-based table: columns line up like a real table, the body scrolls
 * horizontally once the screen is narrower than the columns need.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  rowClassName,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty: React.ReactNode;
  rowClassName?: string;
}) {
  const template = columns.map((c) => c.width).join(" ");
  const minWidth = minWidthOf(columns.map((c) => c.width));
  const alignCls = (c: Column<T>) => (c.align === "right" ? "justify-self-end text-right" : "");

  return (
    <div className="overflow-x-auto">
      <div role="table" style={{ minWidth }}>
        <div
          role="row"
          className="grid min-h-10 items-center gap-x-3 border-y border-line bg-subtle px-5 text-[11.5px] font-semibold tracking-[0.05em] text-muted uppercase"
          style={{ gridTemplateColumns: template }}
        >
          {columns.map((c) => (
            <span key={c.key} role="columnheader" className={alignCls(c)}>
              {c.header}
            </span>
          ))}
        </div>
        {rows.map((row, idx) => (
          <div
            key={rowKey(row)}
            role="row"
            className={cn(
              "grid min-h-[58px] items-center gap-x-3 px-5 py-2.5 transition-colors hover:bg-[#fafbfd]",
              idx > 0 && "border-t border-line-soft",
              rowClassName,
            )}
            style={{ gridTemplateColumns: template }}
          >
            {columns.map((c) => (
              <div key={c.key} role="cell" className={cn("min-w-0", alignCls(c), c.className)}>
                {c.cell(row)}
              </div>
            ))}
          </div>
        ))}
        {rows.length === 0 && <div className="border-t border-line-soft px-5 py-10 text-center text-muted">{empty}</div>}
      </div>
    </div>
  );
}
