import { GODOWN_IDS, GST_RATE, TODAY } from "./constants";
import type {
  InventoryState,
  Item,
  LineItem,
  PurchaseOrder,
  SalesOrder,
  StockLevel,
} from "./types";
import { formatNumber, plural } from "./format";

export const totalQty = (item: Item) => GODOWN_IDS.reduce((s, g) => s + item.stock[g], 0);

export function stockLevel(item: Item): StockLevel {
  const t = totalQty(item);
  if (t === 0) return "out";
  return t < item.minLevel ? "low" : "ok";
}

export const subtotal = (lines: LineItem[]) => lines.reduce((s, l) => s + l.qty * l.rate, 0);
export const gst = (lines: LineItem[]) => Math.round(subtotal(lines) * GST_RATE);
/** Order value including GST. */
export const orderTotal = (lines: LineItem[]) => Math.round(subtotal(lines) * (1 + GST_RATE));
/** Combined value incl. GST of a list of orders. */
export const totalValue = (orders: { lines: LineItem[] }[]) => orders.reduce((s, o) => s + orderTotal(o.lines), 0);
export const units = (lines: LineItem[]) => lines.reduce((s, l) => s + l.qty, 0);

export const linesSummary = (lines: LineItem[]) =>
  `${plural(lines.length, "item")} · ${formatNumber(units(lines))} units`;

export const isOverdue = (p: PurchaseOrder) => p.status === "Pending" && p.expected < TODAY;

/** Quantity of an SKU across a set of orders (e.g. pending POs → "on order"). */
export function qtyAcross(orders: { lines: LineItem[] }[], sku: string): number {
  return orders.reduce(
    (s, o) => s + o.lines.filter((l) => l.sku === sku).reduce((a, l) => a + l.qty, 0),
    0,
  );
}

export const byNewest = <T extends { date: string; id: string }>(a: T, b: T) =>
  (b.date + b.id).localeCompare(a.date + a.id);

export function findItem(state: InventoryState, sku: string): Item {
  const i = state.items.find((x) => x.sku === sku);
  if (!i) throw new Error(`Unknown SKU ${sku}`);
  return i;
}

export function findCustomer(state: InventoryState, id: string) {
  const c = state.customers.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown customer ${id}`);
  return c;
}

export function findSupplier(state: InventoryState, id: string) {
  const s = state.suppliers.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown supplier ${id}`);
  return s;
}

/** True when the dispatching godown holds enough of every line. */
export const canShip = (state: InventoryState, o: SalesOrder) =>
  o.lines.every((l) => findItem(state, l.sku).stock[o.godownId] >= l.qty);

export const pendingPurchases = (s: InventoryState) => s.purchases.filter((p) => p.status === "Pending");
export const confirmedSales = (s: InventoryState) => s.sales.filter((o) => o.status === "Confirmed");
export const lowStockItems = (s: InventoryState) => s.items.filter((i) => stockLevel(i) !== "ok");

export const stockValue = (items: Item[]) => items.reduce((s, i) => s + totalQty(i) * i.cost, 0);

/**
 * Reorder suggestion: top the item up to twice its minimum, counting what is
 * already on order, rounded up to a pack of 10.
 */
export function suggestedReorderQty(state: InventoryState, item: Item): number {
  const onOrder = qtyAcross(pendingPurchases(state), item.sku);
  const need = Math.max(item.minLevel * 2 - totalQty(item) - onOrder, item.minLevel);
  return Math.ceil(need / 10) * 10;
}

export const marginPct = (i: Item) => Math.round(((i.price - i.cost) / i.price) * 100);

/**
 * An item's movements, newest first, each with the company-wide balance
 * right after it. Walks back from today's balance.
 */
export function movementsWithBalance(state: InventoryState, sku: string, limit: number) {
  let balance = totalQty(findItem(state, sku));
  return state.movements
    .filter((m) => m.sku === sku)
    .slice(0, limit)
    .map((m) => {
      const row = { ...m, balanceAfter: balance };
      balance -= m.qty;
      return row;
    });
}
