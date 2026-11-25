import { isOverdue } from "./selectors";
import type { MovementType, PurchaseOrder, SaleStatus, StockLevel } from "./types";

/** One place that decides how each status looks. Tones map to Badge variants. */

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export const saleTone: Record<SaleStatus, Tone> = {
  Confirmed: "info",
  Dispatched: "warning",
  Paid: "success",
};

export function purchaseBadge(p: PurchaseOrder): { label: string; tone: Tone } {
  if (p.status === "Received") return { label: "Received", tone: "success" };
  return isOverdue(p) ? { label: "Overdue", tone: "danger" } : { label: "Pending", tone: "info" };
}

export const stockBadge: Record<StockLevel, { label: string; tone: Tone }> = {
  ok: { label: "In stock", tone: "success" },
  low: { label: "Low stock", tone: "warning" },
  out: { label: "Out of stock", tone: "danger" },
};

export const movementTone: Record<MovementType, Tone> = {
  Purchase: "success",
  Sale: "info",
  "Transfer in": "neutral",
  "Transfer out": "neutral",
};
