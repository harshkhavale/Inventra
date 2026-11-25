"use client";

import { Plus, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { Item } from "@/lib/types";
import type { LineDraft } from "@/store/commands";

/** Item picker grouped by category. */
export function ItemSelect({ items, className, ...props }: { items: Item[] } & React.ComponentProps<"select">) {
  return (
    <Select className={className} {...props}>
      {CATEGORIES.map((cat) => (
        <optgroup key={cat} label={cat}>
          {items
            .filter((i) => i.category === cat)
            .map((i) => (
              <option key={i.sku} value={i.sku}>
                {i.name}
              </option>
            ))}
        </optgroup>
      ))}
    </Select>
  );
}

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
  const grid = withRate
    ? "grid-cols-[minmax(0,1fr)_88px_100px_96px_36px]"
    : "grid-cols-[minmax(0,1fr)_100px_110px_36px]";

  const update = (idx: number, patch: Partial<LineDraft>) =>
    onChange(lines.map((l, j) => (j === idx ? { ...l, ...patch } : l)));

  const add = () => {
    const next = nextLine();
    if (next) onChange([...lines, next]);
  };

  return (
    <div className="flex flex-col gap-2.5 overflow-x-auto">
      <div className={cn("grid min-w-[520px] gap-2.5 text-[12.5px] font-semibold text-[#3b4556]", grid)}>
        <span>Item</span>
        <span>Quantity</span>
        {withRate && <span>Rate (₹)</span>}
        <span className="justify-self-end">Amount</span>
        <span />
      </div>
      {lines.map((l, idx) => {
        const hint = hintOf(l);
        return (
          <div key={idx} className="min-w-[520px]">
            <div className={cn("grid items-center gap-2.5", grid)}>
              <ItemSelect
                items={items}
                aria-label={`Item, line ${idx + 1}`}
                value={l.sku}
                onChange={(e) => onChange(lines.map((x, j) => (j === idx ? (onSkuChange ? onSkuChange(x, e.target.value) : { ...x, sku: e.target.value }) : x)))}
              />
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="0"
                aria-label={`Quantity, line ${idx + 1}`}
                className="tabular"
                value={l.qty}
                onChange={(e) => update(idx, { qty: e.target.value })}
                autoFocus={idx === lines.length - 1 && l.qty === ""}
              />
              {withRate && (
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  aria-label={`Rate, line ${idx + 1}`}
                  className="tabular"
                  value={l.rate}
                  onChange={(e) => update(idx, { rate: e.target.value })}
                />
              )}
              <span className="tabular justify-self-end font-semibold">{amountOf(l)}</span>
              {lines.length > 1 ? (
                <IconButton aria-label={`Remove line ${idx + 1}`} onClick={() => onChange(lines.filter((_, j) => j !== idx))}>
                  <X className="size-[15px]" />
                </IconButton>
              ) : (
                <span />
              )}
            </div>
            <div className={cn("mt-1 text-[12.5px]", hint.tone === "bad" ? "text-bad" : hint.tone === "warn" ? "text-warn-text" : "text-muted")}>
              {hint.text}
            </div>
          </div>
        );
      })}
      <div>
        <Button variant="ghost" size="sm" onClick={add} disabled={lines.length >= items.length}>
          <Plus className="size-3.5" /> Add item
        </Button>
      </div>
    </div>
  );
}
