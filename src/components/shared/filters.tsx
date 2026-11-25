"use client";

import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface ChipOption<K extends string> {
  key: K;
  label: string;
  count: number;
}

/** Status filter with live counts. shadcn ToggleGroup (single select). */
export function FilterChips<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ChipOption<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={2}
      aria-label={label}
      value={value}
      // Radix sends "" when the active item is clicked again; keep a selection.
      onValueChange={(v) => v && onChange(v as K)}
      className="flex-wrap"
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.key}
          value={o.key}
          className="rounded-full bg-card px-3 data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"
        >
          {o.label}
          <span className="tabular text-[11.5px] font-semibold opacity-70">{o.count}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Search box. shadcn InputGroup with a leading icon. */
export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <InputGroup className="w-full bg-card sm:max-w-[340px] sm:flex-[1_1_240px]">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput type="search" aria-label={label} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </InputGroup>
  );
}

/** Switch between views of the same data. shadcn Tabs used as a segmented control. */
export function ViewTabs<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as K)}>
      <TabsList aria-label={label}>
        {options.map((o) => (
          <TabsTrigger key={o.key} value={o.key} className="px-3">
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/** Filters on the left, search on the right, above a table. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4">{children}</div>;
}
