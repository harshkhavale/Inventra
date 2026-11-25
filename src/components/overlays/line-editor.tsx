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

/**
 * Editable list of order lines. The parent owns the lines and decides the
 * amount and hint for each one, so the same editor serves sales and POs.
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
  const grid = withRate ? "grid-cols-[minmax(0,1fr)_88px_100px_96px_36px]" : "grid-cols-[minmax(0,1fr)_100px_110px_36px]";

  const update = (idx: number, patch: Partial<LineDraft>) => onChange(lines.map((l, j) => (j === idx ? { ...l, ...patch } : l)));
  const changeSku = (idx: number, sku: string) =>
    onChange(lines.map((l, j) => (j !== idx ? l : onSkuChange ? onSkuChange(l, sku) : { ...l, sku })));
  const add = () => {
    const next = nextLine();
    if (next) onChange([...lines, next]);
  };

  return (
    <div className="-mx-1 flex flex-col gap-2.5 overflow-x-auto px-1">
      <div className={cn("grid min-w-[520px] gap-2.5 text-[12.5px] font-medium text-muted-foreground", grid)}>
        <span>Item</span>
        <span>Quantity</span>
        {withRate && <span>Rate (₹)</span>}
        <span className="text-right">Amount</span>
        <span />
      </div>
      {lines.map((l, idx) => {
        const hint = hintOf(l);
        return (
          <div key={idx} className="min-w-[520px]">
            <div className={cn("grid items-center gap-2.5", grid)}>
              <ItemSelect items={items} aria-label={`Item, line ${idx + 1}`} value={l.sku} onChange={(sku) => changeSku(idx, sku)} />
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
              {withRate && (
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
              )}
              <span className="tabular text-right font-semibold">{amountOf(l)}</span>
              {lines.length > 1 ? (
                <Button variant="ghost" size="icon" aria-label={`Remove line ${idx + 1}`} onClick={() => onChange(lines.filter((_, j) => j !== idx))}>
                  <X />
                </Button>
              ) : (
                <span />
              )}
            </div>
            <p className={cn("mt-1 text-[12.5px]", hint.tone === "bad" ? "text-danger" : hint.tone === "warn" ? "text-warning-fill" : "text-muted-foreground")}>
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
