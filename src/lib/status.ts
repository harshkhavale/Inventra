import { isOverdue } from "./selectors";
import type { MovementType, PurchaseOrder, SaleStatus, StockLevel } from "./types";

/** One place that decides how each status looks. */

export type Tone = "green" | "amber" | "red" | "blue" | "gray";

export const saleTone: Record<SaleStatus, Tone> = {
  Confirmed: "blue",
  Dispatched: "amber",
  Paid: "green",
};

export function purchaseBadge(p: PurchaseOrder): { label: string; tone: Tone } {
  if (p.status === "Received") return { label: "Received", tone: "green" };
  return isOverdue(p) ? { label: "Overdue", tone: "red" } : { label: "Pending", tone: "blue" };
}

export const stockBadge: Record<StockLevel, { label: string; tone: Tone }> = {
  ok: { label: "In stock", tone: "green" },
  low: { label: "Low stock", tone: "amber" },
  out: { label: "Out of stock", tone: "red" },
};

export const movementTone: Record<MovementType, Tone> = {
  Purchase: "green",
  Sale: "blue",
  "Transfer in": "gray",
  "Transfer out": "gray",
};
