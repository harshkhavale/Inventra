/**
 * Workflow commands. Each one is a pure function: it takes the current state
 * and returns either the next state plus a human-readable message, or an
 * error explaining why the action can't happen. Nothing here touches React.
 */
import { godown, TODAY } from "@/lib/constants";
import { addDays, formatMoney, formatNumber, nowStamp, plural } from "@/lib/format";
import { findCustomer, findItem, findSupplier, orderTotal, totalQty, units } from "@/lib/selectors";
import type { Activity, GodownId, InventoryState, Item, LineItem, StockMovement } from "@/lib/types";

export type Outcome =
  | { ok: true; state: InventoryState; message: string; tone?: "success" | "error" }
  | { ok: false; error: string };

const fail = (error: string): Outcome => ({ ok: false, error });

/** Copy items deeply enough that stock can be mutated safely. */
const cloneItems = (items: Item[]) => items.map((i) => ({ ...i, stock: { ...i.stock } }));

function lowStockAlert(item: Item, before: number, after: number, at: string): Activity | null {
  if (before >= item.minLevel && after < item.minLevel) {
    return { at, kind: "alert", title: `Low stock · ${item.name}`, meta: `${after} ${item.unit} left, minimum ${item.minLevel}` };
  }
  return null;
}

/* ---------------------------------------------------------------- Sales */

export function dispatchSale(state: InventoryState, id: string): Outcome {
  const order = state.sales.find((o) => o.id === id);
  if (!order || order.status !== "Confirmed") return fail(`${id} is not awaiting dispatch.`);
  const g = godown(order.godownId);

  for (const l of order.lines) {
    const i = findItem(state, l.sku);
    if (i.stock[order.godownId] < l.qty) {
      return fail(
        `Only ${i.stock[order.godownId]} × ${i.name} at ${g.short} (needs ${l.qty}). Transfer stock or receive a PO first.`,
      );
    }
  }

  const at = nowStamp();
  const invoice = `INV-${state.counters.invoice}`;
  const items = cloneItems(state.items);
  const movements: StockMovement[] = [];
  const alerts: Activity[] = [];

  for (const l of order.lines) {
    const i = items.find((x) => x.sku === l.sku)!;
    const before = totalQty(i);
    i.stock[order.godownId] -= l.qty;
    movements.push({ at, sku: l.sku, godownId: order.godownId, qty: -l.qty, type: "Sale", ref: invoice });
    const alert = lowStockAlert(i, before, totalQty(i), at);
    if (alert) alerts.push(alert);
  }

  const customer = findCustomer(state, order.customerId).name;
  const dispatched: Activity = { at, kind: "dispatch", title: `${invoice} dispatched from ${g.short}`, meta: `${order.id} · ${customer}` };

  return {
    ok: true,
    state: {
      ...state,
      items,
      sales: state.sales.map((o) => (o.id === id ? { ...o, status: "Dispatched", invoice, dispatchedOn: TODAY } : o)),
      movements: [...movements, ...state.movements],
      activity: [...alerts, dispatched, ...state.activity],
      counters: { ...state.counters, invoice: state.counters.invoice + 1 },
    },
    message:
      `${order.id} dispatched and ${invoice} raised. Stock reduced at ${g.short}` +
      (alerts.length ? `. ${plural(alerts.length, "item")} just fell below minimum.` : "."),
  };
}

export function markSalePaid(state: InventoryState, id: string): Outcome {
  const order = state.sales.find((o) => o.id === id);
  if (!order || order.status !== "Dispatched") return fail(`${id} has no open invoice.`);
  const customer = findCustomer(state, order.customerId).name;
  const amount = formatMoney(orderTotal(order.lines));

  return {
    ok: true,
    state: {
      ...state,
      sales: state.sales.map((o) => (o.id === id ? { ...o, status: "Paid", paidOn: TODAY } : o)),
      activity: [{ at: nowStamp(), kind: "pay", title: `Payment received · ${customer}`, meta: `${order.invoice} · ${amount}` }, ...state.activity],
    },
    message: `${amount} received from ${customer} against ${order.invoice}.`,
  };
}

export interface LineDraft {
  sku: string;
  qty: string;
  rate: string;
}

/** Validates editable form lines and turns them into typed line items. */
export function parseLines(drafts: LineDraft[], rateFor: (d: LineDraft) => number): { lines: LineItem[] } | { error: string } {
  const lines = drafts.map((d) => ({ sku: d.sku, qty: parseInt(d.qty, 10), rate: rateFor(d) }));
  if (lines.length === 0) return { error: "Add at least one item." };
  if (lines.some((l) => !(l.qty > 0))) return { error: "Enter a quantity of at least 1 for every line." };
  if (lines.some((l) => !(l.rate > 0))) return { error: "Enter a rate for every line." };
  const skus = lines.map((l) => l.sku);
  if (new Set(skus).size !== skus.length) return { error: "Each item can appear only once. Combine the quantities into one line." };
  return { lines };
}

export interface SaleDraft {
  customerId: string;
  godownId: GodownId;
  lines: LineDraft[];
}

export function createSale(state: InventoryState, draft: SaleDraft, dispatchNow: boolean): Outcome {
  const parsed = parseLines(draft.lines, (d) => findItem(state, d.sku).price);
  if ("error" in parsed) return fail(parsed.error);

  const id = `SO-${state.counters.sale}`;
  const customer = findCustomer(state, draft.customerId).name;
  const booked: InventoryState = {
    ...state,
    sales: [{ id, date: TODAY, customerId: draft.customerId, godownId: draft.godownId, lines: parsed.lines, status: "Confirmed", invoice: "" }, ...state.sales],
    activity: [{ at: nowStamp(), kind: "sale", title: `${id} booked · ${customer}`, meta: formatMoney(orderTotal(parsed.lines)) }, ...state.activity],
    counters: { ...state.counters, sale: state.counters.sale + 1 },
  };

  if (!dispatchNow) {
    return { ok: true, state: booked, message: `${id} booked for ${customer}. Dispatch it when the goods leave ${godown(draft.godownId).short}.` };
  }
  const dispatched = dispatchSale(booked, id);
  if (!dispatched.ok) {
    // The order is still worth keeping; tell the user why it didn't ship.
    return { ok: true, state: booked, tone: "error", message: `${id} saved as confirmed, but can’t dispatch: ${dispatched.error}` };
  }
  return dispatched;
}

/* ------------------------------------------------------------ Purchases */

export interface PurchaseDraft {
  supplierId: string;
  godownId: GodownId;
  expected: string;
  lines: LineDraft[];
}

export function createPurchase(state: InventoryState, draft: PurchaseDraft): Outcome {
  const parsed = parseLines(draft.lines, (d) => parseFloat(d.rate));
  if ("error" in parsed) return fail(parsed.error);

  const id = `PO-${state.counters.purchase}`;
  const supplier = findSupplier(state, draft.supplierId).name;
  return {
    ok: true,
    state: {
      ...state,
      purchases: [
        { id, date: TODAY, supplierId: draft.supplierId, godownId: draft.godownId, lines: parsed.lines, status: "Pending", expected: draft.expected || addDays(TODAY, 5) },
        ...state.purchases,
      ],
      activity: [{ at: nowStamp(), kind: "po", title: `${id} raised · ${supplier}`, meta: formatMoney(orderTotal(parsed.lines)) }, ...state.activity],
      counters: { ...state.counters, purchase: state.counters.purchase + 1 },
    },
    message: `${id} raised with ${supplier}. Mark it received when goods reach ${godown(draft.godownId).short}.`,
  };
}

export function receivePurchase(state: InventoryState, id: string): Outcome {
  const order = state.purchases.find((p) => p.id === id);
  if (!order || order.status !== "Pending") return fail(`${id} is not pending.`);
  const g = godown(order.godownId);
  const at = nowStamp();
  const items = cloneItems(state.items);
  const movements: StockMovement[] = [];
  let recovered = 0;

  for (const l of order.lines) {
    const i = items.find((x) => x.sku === l.sku)!;
    const before = totalQty(i);
    i.stock[order.godownId] += l.qty;
    if (before < i.minLevel && totalQty(i) >= i.minLevel) recovered++;
    movements.push({ at, sku: l.sku, godownId: order.godownId, qty: l.qty, type: "Purchase", ref: order.id });
  }

  const added = formatNumber(units(order.lines));
  return {
    ok: true,
    state: {
      ...state,
      items,
      purchases: state.purchases.map((p) => (p.id === id ? { ...p, status: "Received", receivedOn: TODAY } : p)),
      movements: [...movements, ...state.movements],
      activity: [{ at, kind: "receive", title: `${order.id} received at ${g.short}`, meta: `${added} units added` }, ...state.activity],
    },
    message:
      `${order.id} received. ${added} units added to ${g.short}` +
      (recovered ? `, ${plural(recovered, "item")} back above minimum.` : "."),
  };
}

/* ------------------------------------------------------------ Transfers */

export interface TransferDraft {
  sku: string;
  from: GodownId;
  to: GodownId;
  qty: string;
}

export function transferStock(state: InventoryState, draft: TransferDraft): Outcome {
  const qty = parseInt(draft.qty, 10);
  const item = findItem(state, draft.sku);
  if (draft.from === draft.to) return fail("Pick two different godowns.");
  if (!(qty > 0)) return fail("Enter a quantity of at least 1.");
  if (qty > item.stock[draft.from]) return fail(`Only ${item.stock[draft.from]} available at ${godown(draft.from).short}.`);

  const id = `TR-${state.counters.transfer}`;
  const at = nowStamp();
  const from = godown(draft.from).short;
  const to = godown(draft.to).short;

  return {
    ok: true,
    state: {
      ...state,
      items: state.items.map((i) =>
        i.sku !== draft.sku ? i : { ...i, stock: { ...i.stock, [draft.from]: i.stock[draft.from] - qty, [draft.to]: i.stock[draft.to] + qty } },
      ),
      transfers: [{ id, date: TODAY, sku: draft.sku, from: draft.from, to: draft.to, qty }, ...state.transfers],
      movements: [
        { at, sku: draft.sku, godownId: draft.from, qty: -qty, type: "Transfer out", ref: id },
        { at, sku: draft.sku, godownId: draft.to, qty, type: "Transfer in", ref: id },
        ...state.movements,
      ],
      activity: [{ at, kind: "transfer", title: `${id} · ${from} → ${to}`, meta: `${qty} × ${item.name}` }, ...state.activity],
      counters: { ...state.counters, transfer: state.counters.transfer + 1 },
    },
    message: `${qty} × ${item.name} moved from ${from} to ${to}.`,
  };
}
