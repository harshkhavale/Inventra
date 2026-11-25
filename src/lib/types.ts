export type GodownId = "HWH" | "SLK" | "DGP";

export type Category = "Lighting" | "Wires & Cables" | "Switchgear" | "Fans" | "Accessories";

export interface Godown {
  id: GodownId;
  name: string;
  short: string;
  city: string;
  area: string;
  manager: string;
}

export interface Item {
  sku: string;
  name: string;
  category: Category;
  unit: string;
  cost: number;
  price: number;
  minLevel: number;
  supplierId: string;
  stock: Record<GodownId, number>;
}

export interface Customer {
  id: string;
  name: string;
  city: string;
  contact: string;
  phone: string;
  gstin: string;
}

export interface Supplier extends Customer {
  leadDays: number;
}

export interface LineItem {
  sku: string;
  qty: number;
  rate: number;
}

export type SaleStatus = "Confirmed" | "Dispatched" | "Paid";

export interface SalesOrder {
  id: string;
  date: string;
  customerId: string;
  godownId: GodownId;
  lines: LineItem[];
  status: SaleStatus;
  invoice: string;
  dispatchedOn?: string;
  paidOn?: string;
}

export type PurchaseStatus = "Pending" | "Received";

export interface PurchaseOrder {
  id: string;
  date: string;
  supplierId: string;
  godownId: GodownId;
  lines: LineItem[];
  status: PurchaseStatus;
  expected: string;
  receivedOn?: string;
}

export interface Transfer {
  id: string;
  date: string;
  sku: string;
  from: GodownId;
  to: GodownId;
  qty: number;
}

export type MovementType = "Purchase" | "Sale" | "Transfer in" | "Transfer out";

/** One change to the quantity of one item at one godown. */
export interface StockMovement {
  at: string;
  sku: string;
  godownId: GodownId;
  qty: number;
  type: MovementType;
  ref: string;
}

export type ActivityKind = "sale" | "dispatch" | "pay" | "po" | "receive" | "transfer" | "alert";

export interface Activity {
  at: string;
  kind: ActivityKind;
  title: string;
  meta: string;
}

export interface Counters {
  sale: number;
  purchase: number;
  invoice: number;
  transfer: number;
}

export interface InventoryState {
  items: Item[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: SalesOrder[];
  purchases: PurchaseOrder[];
  transfers: Transfer[];
  movements: StockMovement[];
  activity: Activity[];
  counters: Counters;
}

export type StockLevel = "ok" | "low" | "out";
