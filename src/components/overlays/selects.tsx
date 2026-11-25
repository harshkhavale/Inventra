"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, GODOWNS } from "@/lib/constants";
import type { GodownId, Item } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BaseProps<V extends string> {
  value: V;
  onChange: (v: V) => void;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

/** Plain list select. shadcn Select. */
export function OptionSelect<V extends string>({ value, onChange, options, className, ...rest }: BaseProps<V> & { options: { value: V; label: string }[] }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as V)}>
      <SelectTrigger className={cn("w-full bg-card", className)} id={rest.id} aria-label={rest["aria-label"]}>
        {/* Explicit label so the value shows before hydration, not after. */}
        <SelectValue>{options.find((o) => o.value === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function GodownSelect(props: BaseProps<GodownId>) {
  return <OptionSelect {...props} options={GODOWNS.map((g) => ({ value: g.id, label: g.name }))} />;
}

/** Item picker grouped by category. */
export function ItemSelect({ items, value, onChange, className, ...rest }: BaseProps<string> & { items: Item[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full min-w-0 bg-card", className)} id={rest.id} aria-label={rest["aria-label"]}>
        <SelectValue>{items.find((i) => i.sku === value)?.name}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((cat) => (
          <SelectGroup key={cat}>
            <SelectLabel>{cat}</SelectLabel>
            {items
              .filter((i) => i.category === cat)
              .map((i) => (
                <SelectItem key={i.sku} value={i.sku}>
                  {i.name}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
