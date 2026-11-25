"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, Totals } from "@/components/ui/dialog";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import { useCommands } from "@/hooks/use-commands";
import { GODOWNS, GST_RATE, TODAY } from "@/lib/constants";
import { addDays, formatMoney, formatNumber } from "@/lib/format";
import { findItem, findSupplier, suggestedReorderQty, totalQty } from "@/lib/selectors";
import type { GodownId, InventoryState } from "@/lib/types";
import type { LineDraft, PurchaseDraft } from "@/store/commands";
import { useInventory } from "@/store/inventory-store";
import { LineEditor } from "./line-editor";

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
    <Modal
      eyebrow="Purchase"
      title="New purchase order"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Raise purchase order
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Field label="Supplier">
          <Select value={draft.supplierId} onChange={(e) => changeSupplier(e.target.value)}>
            {state.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Deliver to">
          <Select value={draft.godownId} onChange={(e) => patch({ godownId: e.target.value as GodownId })}>
            {GODOWNS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Expected delivery">
          <Input type="date" min={TODAY} value={draft.expected} onChange={(e) => patch({ expected: e.target.value })} />
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
      <FormError>{error}</FormError>
    </Modal>
  );
}
