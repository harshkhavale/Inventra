"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCommands } from "@/hooks/use-commands";
import { GODOWN_IDS, GODOWNS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { findItem } from "@/lib/selectors";
import type { GodownId, InventoryState } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TransferDraft } from "@/store/commands";
import { useInventory } from "@/store/inventory-store";
import { FormDialog } from "./overlay-shells";
import { GodownSelect, ItemSelect } from "./selects";

/** Default the source to wherever the item is most plentiful. */
function initialDraft(state: InventoryState, sku?: string, from?: GodownId): TransferDraft {
  const item = findItem(state, sku ?? state.items[0].sku);
  const source = from ?? [...GODOWN_IDS].sort((a, b) => item.stock[b] - item.stock[a])[0];
  return { sku: item.sku, from: source, to: source === "HWH" ? "SLK" : "HWH", qty: "" };
}

export function TransferForm({ sku, from, onClose }: { sku?: string; from?: GodownId; onClose: () => void }) {
  const state = useInventory();
  const { transferStock } = useCommands();
  const [draft, setDraft] = useState(() => initialDraft(state, sku, from));
  const [error, setError] = useState("");
  const item = findItem(state, draft.sku);

  const patch = (p: Partial<TransferDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setError("");
  };

  const submit = () => {
    const err = transferStock(draft);
    if (err) setError(err);
    else onClose();
  };

  return (
    <FormDialog
      eyebrow="Godowns"
      title="Transfer stock"
      description="Move units of one item from one godown to another."
      className="sm:max-w-[560px]"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Move stock</Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="tr-item">Item</FieldLabel>
        <ItemSelect id="tr-item" items={state.items} value={draft.sku} onChange={(s) => patch({ sku: s })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="tr-from">From</FieldLabel>
          <GodownSelect id="tr-from" value={draft.from} onChange={(f) => patch({ from: f })} />
        </Field>
        <Field>
          <FieldLabel htmlFor="tr-to">To</FieldLabel>
          <GodownSelect id="tr-to" value={draft.to} onChange={(t) => patch({ to: t })} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2.5" aria-label="Available quantity by godown">
        {GODOWNS.map((g) => {
          const role = g.id === draft.from ? "from" : g.id === draft.to ? "to" : null;
          return (
            <div
              key={g.id}
              className={cn(
                "rounded-lg border bg-muted/50 p-3",
                role === "from" ? "border-primary" : role === "to" ? "border-success-fill" : "border-transparent",
              )}
            >
              <div className="text-xs text-muted-foreground">
                {g.short}
                {role && ` · ${role}`}
              </div>
              <div className="tabular mt-0.5 text-lg font-semibold">{formatNumber(item.stock[g.id])}</div>
            </div>
          );
        })}
      </div>

      <Field>
        <FieldLabel htmlFor="tr-qty">Quantity to move</FieldLabel>
        <Input
          id="tr-qty"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="0"
          className="tabular bg-card"
          autoFocus
          value={draft.qty}
          onChange={(e) => patch({ qty: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </Field>
      {error && <FieldError className="rounded-md bg-danger-soft px-3.5 py-2.5">{error}</FieldError>}
    </FormDialog>
  );
}
