"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import { useCommands } from "@/hooks/use-commands";
import { GODOWN_IDS, GODOWNS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { findItem } from "@/lib/selectors";
import type { GodownId, InventoryState } from "@/lib/types";
import type { TransferDraft } from "@/store/commands";
import { useInventory } from "@/store/inventory-store";
import { ItemSelect } from "./line-editor";

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
    <Modal
      eyebrow="Godowns"
      title="Transfer stock"
      width={560}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Move stock
          </Button>
        </>
      }
    >
      <Field label="Item">
        <ItemSelect items={state.items} value={draft.sku} onChange={(e) => patch({ sku: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="From">
          <Select value={draft.from} onChange={(e) => patch({ from: e.target.value as GodownId })}>
            {GODOWNS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="To">
          <Select value={draft.to} onChange={(e) => patch({ to: e.target.value as GodownId })}>
            {GODOWNS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2.5" aria-label="Available quantity by godown">
        {GODOWNS.map((g) => {
          const role = g.id === draft.from ? "from" : g.id === draft.to ? "to" : null;
          return (
            <div
              key={g.id}
              className={cn(
                "rounded-[10px] border bg-tint p-3",
                role === "from" ? "border-brand" : role === "to" ? "border-good-fill" : "border-transparent",
              )}
            >
              <div className="text-xs text-muted">
                {g.short}
                {role && ` · ${role}`}
              </div>
              <div className="tabular mt-0.5 text-lg font-[650]">{formatNumber(item.stock[g.id])}</div>
            </div>
          );
        })}
      </div>

      <Field label="Quantity to move">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="0"
          className="tabular"
          autoFocus
          value={draft.qty}
          onChange={(e) => patch({ qty: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </Field>
      <FormError>{error}</FormError>
    </Modal>
  );
}
