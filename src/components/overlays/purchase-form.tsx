"use client";

import { useState } from "react";
import { Totals } from "@/components/shared/misc";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCommands } from "@/hooks/use-commands";
import { GST_RATE, TODAY } from "@/lib/constants";
import { addDays, formatMoney, formatNumber } from "@/lib/format";
import { findItem, findSupplier, suggestedReorderQty, totalQty } from "@/lib/selectors";
import type { InventoryState } from "@/lib/types";
import type { LineDraft, PurchaseDraft } from "@/store/commands";
import { useInventory } from "@/store/inventory-store";
import { LineEditor } from "./line-editor";
import { FormDialog } from "./overlay-shells";
import { GodownSelect, OptionSelect } from "./selects";

/** Blank PO, or a reorder pre-filled for one item with a suggested quantity. */
function initialDraft(state: InventoryState, sku?: string): PurchaseDraft {
  if (sku) {
    const item = findItem(state, sku);
    const supplier = findSupplier(state, item.supplierId);
    return {
      supplierId: supplier.id,
      godownId: "HWH",
      expected: addDays(TODAY, supplier.leadDays),
      lines: [{ sku, qty: String(suggestedReorderQty(state, item)), rate: String(item.cost) }],
    };
  }
  const supplier = state.suppliers[0];
  const first = state.items.find((i) => i.supplierId === supplier.id) ?? state.items[0];
  return {
    supplierId: supplier.id,
    godownId: "HWH",
    expected: addDays(TODAY, supplier.leadDays),
    lines: [{ sku: first.sku, qty: "", rate: String(first.cost) }],
  };
}

export function PurchaseForm({ sku, onClose }: { sku?: string; onClose: () => void }) {
  const state = useInventory();
  const { createPurchase } = useCommands();
  const [draft, setDraft] = useState(() => initialDraft(state, sku));
  const [error, setError] = useState("");

  const patch = (p: Partial<PurchaseDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setError("");
  };

  /** Switching supplier swaps untouched lines to that supplier's items and resets the expected date. */
  const changeSupplier = (supplierId: string) => {
    const supplier = findSupplier(state, supplierId);
    const first = state.items.find((i) => i.supplierId === supplierId);
    patch({
      supplierId,
      expected: addDays(TODAY, supplier.leadDays),
      lines: draft.lines.map((l) => (l.qty === "" && first ? { sku: first.sku, qty: "", rate: String(first.cost) } : l)),
    });
  };

  const amount = (l: LineDraft) => (parseInt(l.qty, 10) || 0) * (parseFloat(l.rate) || 0);
  const sub = draft.lines.reduce((s, l) => s + amount(l), 0);

  const submit = () => {
    const err = createPurchase(draft);
    if (err) setError(err);
    else onClose();
  };

  return (
    <FormDialog
      eyebrow="Purchase"
      title="New purchase order"
      description="Stock is added to the delivery godown when you mark the PO received."
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Raise purchase order</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="po-supplier">Supplier</FieldLabel>
          <OptionSelect id="po-supplier" value={draft.supplierId} onChange={changeSupplier} options={state.suppliers.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <Field>
          <FieldLabel htmlFor="po-godown">Deliver to</FieldLabel>
          <GodownSelect id="po-godown" value={draft.godownId} onChange={(godownId) => patch({ godownId })} />
        </Field>
        <Field>
          <FieldLabel htmlFor="po-expected">Expected delivery</FieldLabel>
          <Input id="po-expected" type="date" min={TODAY} className="bg-card" value={draft.expected} onChange={(e) => patch({ expected: e.target.value })} />
        </Field>
      </div>

      <LineEditor
        items={state.items}
        lines={draft.lines}
        onChange={(lines) => patch({ lines })}
        withRate
        amountOf={(l) => formatMoney(amount(l))}
        onSkuChange={(l, newSku) => ({ ...l, sku: newSku, rate: String(findItem(state, newSku).cost) })}
        hintOf={(l) => {
          const item = findItem(state, l.sku);
          const text = `On hand ${formatNumber(totalQty(item))} · minimum ${formatNumber(item.minLevel)}`;
          return item.supplierId === draft.supplierId
            ? { text }
            : { text: `${text} · usually from ${findSupplier(state, item.supplierId).name}`, tone: "warn" };
        }}
        nextLine={() => {
          const unused = state.items.filter((i) => !draft.lines.some((l) => l.sku === i.sku));
          const next = unused.find((i) => i.supplierId === draft.supplierId) ?? unused[0];
          return next ? { sku: next.sku, qty: "", rate: String(next.cost) } : null;
        }}
      />

      <Totals subtotal={formatMoney(sub)} gst={formatMoney(Math.round(sub * GST_RATE))} total={formatMoney(Math.round(sub * (1 + GST_RATE)))} />
      {error && <FieldError className="rounded-md bg-danger-soft px-3.5 py-2.5">{error}</FieldError>}
    </FormDialog>
  );
}
