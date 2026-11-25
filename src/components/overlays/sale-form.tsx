"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, Totals } from "@/components/ui/dialog";
import { Field, FormError, Select } from "@/components/ui/field";
import { useCommands } from "@/hooks/use-commands";
import { godown, GODOWNS, GST_RATE } from "@/lib/constants";
import { formatMoney, formatNumber } from "@/lib/format";
import { findItem } from "@/lib/selectors";
import type { GodownId } from "@/lib/types";
import type { LineDraft } from "@/store/commands";
import { useInventory } from "@/store/inventory-store";
import { LineEditor } from "./line-editor";

export function SaleForm({ onClose }: { onClose: () => void }) {
  const state = useInventory();
  const { createSale } = useCommands();
  const [customerId, setCustomerId] = useState(state.customers[0].id);
  const [godownId, setGodownId] = useState<GodownId>("HWH");
  const [lines, setLines] = useState<LineDraft[]>([{ sku: state.items[0].sku, qty: "", rate: "" }]);
  const [error, setError] = useState("");

  const g = godown(godownId);
  const qtyOf = (l: LineDraft) => parseInt(l.qty, 10) || 0;
  const amount = (l: LineDraft) => qtyOf(l) * findItem(state, l.sku).price;
  const sub = lines.reduce((s, l) => s + amount(l), 0);

  const submit = (dispatchNow: boolean) => {
    const err = createSale({ customerId, godownId, lines }, dispatchNow);
    if (err) setError(err);
    else onClose();
  };

  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setError("");
  };

  return (
    <Modal
      eyebrow="Sales"
      title="New sales order"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => submit(false)}>Save as confirmed</Button>
          <Button variant="primary" onClick={() => submit(true)}>
            Save &amp; dispatch now
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Customer">
          <Select value={customerId} onChange={(e) => edit(setCustomerId)(e.target.value)}>
            {state.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dispatch from">
          <Select value={godownId} onChange={(e) => edit(setGodownId)(e.target.value as GodownId)}>
            {GODOWNS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <LineEditor
        items={state.items}
        lines={lines}
        onChange={edit(setLines)}
        withRate={false}
        amountOf={(l) => formatMoney(amount(l))}
        hintOf={(l) => {
          const item = findItem(state, l.sku);
          const available = item.stock[godownId];
          const text = `${formatMoney(item.price)} / ${item.unit} · ${formatNumber(available)} available at ${g.short}`;
          return qtyOf(l) > available ? { text: `${text} · not enough to dispatch`, tone: "bad" } : { text };
        }}
        nextLine={() => {
          const next = state.items.find((i) => !lines.some((l) => l.sku === i.sku));
          return next ? { sku: next.sku, qty: "", rate: "" } : null;
        }}
      />

      <Totals subtotal={formatMoney(sub)} gst={formatMoney(Math.round(sub * GST_RATE))} total={formatMoney(Math.round(sub * (1 + GST_RATE)))} />
      <FormError>{error}</FormError>
    </Modal>
  );
}
