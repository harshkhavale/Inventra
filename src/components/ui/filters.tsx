"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ChipOption<K extends string> {
  key: K;
  label: string;
  count: number;
}

/** Status filter pills with live counts. */
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
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.key)}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
              on ? "border-ink bg-ink text-white" : "border-[#e1e4ea] bg-white text-body hover:border-[#c3c9d4]",
            )}
          >
            {o.label}
            <span className="tabular text-[11.5px] font-semibold opacity-75">{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="relative w-full sm:max-w-[360px] sm:flex-[1_1_260px]">
      <Search aria-hidden className="pointer-events-none absolute top-[11px] left-3 size-4 text-faint" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[38px] w-full rounded-[9px] border border-field bg-white pr-3 pl-9 text-sm outline-none placeholder:text-faint focus:border-brand focus:ring-3 focus:ring-brand/15"
      />
    </label>
  );
}

/** Segmented control for switching between views of the same data. */
export function Segmented<K extends string>({
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
    <div role="group" aria-label={label} className="inline-flex gap-0.5 rounded-[10px] bg-[#eceef2] p-[3px]">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.key)}
            className={cn(
              "min-h-8 rounded-lg px-3.5 text-[13px] font-semibold transition-colors",
              on ? "bg-white text-ink shadow-[0_1px_2px_rgb(16_24_40/0.08),0_0_0_1px_rgb(16_24_40/0.04)]" : "text-[#4a5568] hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** The bar above a table that holds filters on the left and search on the right. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">{children}</div>;
}
