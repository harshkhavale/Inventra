"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { LineDraft } from "@/store/commands";
import { ItemSelect } from "./selects";

export interface LineHint {
  text: string;
  tone?: "warn" | "bad";
}

/** Label shown above a field on phones only; on wider screens the header row labels the columns. */
function MobileLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-muted-foreground sm:hidden">{children}</span>;
}

/**
 * Editable list of order lines. The parent owns the lines and decides the
 * amount and hint for each one, so the same editor serves sales and POs.
 *
 * Wide screens: one row per line under a column header.
 * Phones: each line is a small card (item, then qty / rate / remove, then amount).
 */
export function LineEditor({
  items,
  lines,
  onChange,
  withRate,
  amountOf,
  hintOf,
  onSkuChange,
  nextLine,
}: {
  items: Item[];
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
  withRate: boolean;
  amountOf: (line: LineDraft) => string;
  hintOf: (line: LineDraft) => LineHint;
  /** Lets the parent adjust a line when its item changes (e.g. reset the rate). */
  onSkuChange?: (line: LineDraft, sku: string) => LineDraft;
  /** The line to append on "Add item", or null when every item is used. */
  nextLine: () => LineDraft | null;
}) {
  const grid = withRate
    ? "grid-cols-[1fr_1fr_auto] sm:grid-cols-[minmax(0,1fr)_88px_100px_96px_36px]"
    : "grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1fr)_100px_110px_36px]";

  const update = (idx: number, patch: Partial<LineDraft>) => onChange(lines.map((l, j) => (j === idx ? { ...l, ...patch } : l)));
  const changeSku = (idx: number, sku: string) =>
    onChange(lines.map((l, j) => (j !== idx ? l : onSkuChange ? onSkuChange(l, sku) : { ...l, sku })));
  const add = () => {
    const next = nextLine();
    if (next) onChange([...lines, next]);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-2.5">
      <div className={cn("hidden gap-2.5 text-[12.5px] font-medium text-muted-foreground sm:grid", grid)}>
        <span>Item</span>
        <span>Quantity</span>
        {withRate && <span>Rate (₹)</span>}
        <span className="text-right">Amount</span>
        <span />
      </div>

      {lines.map((l, idx) => {
        const hint = hintOf(l);
        return (
          <div key={idx} className="min-w-0 rounded-lg border p-3 sm:rounded-none sm:border-0 sm:p-0">
            <div className={cn("grid items-end gap-2.5 sm:items-center", grid)}>
              <div className="col-span-full min-w-0 sm:col-span-1">
                <MobileLabel>Item</MobileLabel>
                <ItemSelect items={items} aria-label={`Item, line ${idx + 1}`} value={l.sku} onChange={(sku) => changeSku(idx, sku)} />
              </div>
              <div className="min-w-0">
                <MobileLabel>Quantity</MobileLabel>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="0"
                  aria-label={`Quantity, line ${idx + 1}`}
                  className="tabular bg-card"
                  value={l.qty}
                  onChange={(e) => update(idx, { qty: e.target.value })}
                />
              </div>
              {withRate && (
                <div className="min-w-0">
                  <MobileLabel>Rate (₹)</MobileLabel>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    aria-label={`Rate, line ${idx + 1}`}
                    className="tabular bg-card"
                    value={l.rate}
                    onChange={(e) => update(idx, { rate: e.target.value })}
                  />
                </div>
              )}
              {/* On phones the amount drops to its own line at the bottom of the card. */}
              <div className="col-span-full flex items-baseline justify-between max-sm:order-last sm:col-span-1 sm:justify-end">
                <span className="text-xs font-medium text-muted-foreground sm:hidden">Amount</span>
                <span className="tabular font-semibold">{amountOf(l)}</span>
              </div>
              {lines.length > 1 ? (
                <Button variant="ghost" size="icon" aria-label={`Remove line ${idx + 1}`} onClick={() => onChange(lines.filter((_, j) => j !== idx))}>
                  <X />
                </Button>
              ) : (
                <span className="size-9" />
              )}
            </div>
            <p className={cn("mt-1.5 text-[12.5px]", hint.tone === "bad" ? "text-danger" : hint.tone === "warn" ? "text-warning-fill" : "text-muted-foreground")}>
              {hint.text}
            </p>
          </div>
        );
      })}

      <div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={add} disabled={lines.length >= items.length}>
          <Plus /> Add item
        </Button>
      </div>
    </div>
  );
}
