"use client";

import { useState } from "react";
import { Totals } from "@/components/shared/misc";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useCommands } from "@/hooks/use-commands";
import { godown, GST_RATE } from "@/lib/constants";
import { formatMoney, formatNumber } from "@/lib/format";
import { findItem } from "@/lib/selectors";
import type { GodownId } from "@/lib/types";
import type { LineDraft } from "@/store/commands";
import { useInventory } from "@/store/inventory-store";
import { LineEditor } from "./line-editor";
import { FormDialog } from "./overlay-shells";
import { GodownSelect, OptionSelect } from "./selects";

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

  // Any edit clears a previous validation error.
  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setError("");
  };

  const submit = (dispatchNow: boolean) => {
    const err = createSale({ customerId, godownId, lines }, dispatchNow);
    if (err) setError(err);
    else onClose();
  };

  return (
    <FormDialog
      eyebrow="Sales"
      title="New sales order"
      description="Prices come from the item list. Dispatching reduces stock at the chosen godown."
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => submit(false)}>
            Save as confirmed
          </Button>
          <Button onClick={() => submit(true)}>Save &amp; dispatch now</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="sale-customer">Customer</FieldLabel>
          <OptionSelect
            id="sale-customer"
            value={customerId}
            onChange={edit(setCustomerId)}
            options={state.customers.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="sale-godown">Dispatch from</FieldLabel>
          <GodownSelect id="sale-godown" value={godownId} onChange={edit(setGodownId)} />
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
      {error && <FieldError className="rounded-md bg-danger-soft px-3.5 py-2.5">{error}</FieldError>}
    </FormDialog>
  );
}
