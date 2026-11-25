import type { Category, Godown, GodownId } from "./types";

/**
 * The sample data is written around a fixed "business date" so every
 * relative label (Today, overdue, this month) stays consistent no matter
 * when the demo is opened.
 */
export const TODAY = "2026-11-25";
export const TODAY_LABEL = "Wed, 25 Nov 2026";
export const FINANCIAL_YEAR = "FY 2026–27";

export const COMPANY = "Sen & Sons Electricals";

export const GST_RATE = 0.18;

export const GODOWNS: Godown[] = [
  { id: "HWH", name: "Howrah Main Godown", short: "Howrah", city: "Howrah, WB", area: "18,000 sq ft", manager: "Subrata Pal" },
  { id: "SLK", name: "Salt Lake Hub", short: "Salt Lake", city: "Sector V, Kolkata", area: "6,500 sq ft", manager: "Riya Ghosh" },
  { id: "DGP", name: "Durgapur Depot", short: "Durgapur", city: "Durgapur, WB", area: "4,000 sq ft", manager: "Amit Mondal" },
];

export const GODOWN_IDS: GodownId[] = GODOWNS.map((g) => g.id);

export const CATEGORIES: Category[] = ["Lighting", "Wires & Cables", "Switchgear", "Fans", "Accessories"];

export function godown(id: GodownId): Godown {
  const g = GODOWNS.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown godown ${id}`);
  return g;
}
