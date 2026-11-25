import { godown, TODAY } from "./constants";
import { addDays, formatMoney, formatNumber, stamp } from "./format";
import { orderTotal, units } from "./selectors";
import type {
  Activity,
  Category,
  Customer,
  InventoryState,
  Item,
  PurchaseOrder,
  SalesOrder,
  StockMovement,
  Supplier,
  Transfer,
} from "./types";

function item(
  sku: string, name: string, category: Category, unit: string,
  cost: number, price: number, minLevel: number, supplierId: string,
  hwh: number, slk: number, dgp: number,
): Item {
  return { sku, name, category, unit, cost, price, minLevel, supplierId, stock: { HWH: hwh, SLK: slk, DGP: dgp } };
}

const ITEMS: Item[] = [
  item("LT-LED09", "LED Bulb 9W, B22 Cool Day", "Lighting", "pc", 62, 95, 400, "S2", 820, 240, 160),
  item("LT-PNL18", "LED Round Panel 18W", "Lighting", "pc", 310, 465, 60, "S2", 0, 0, 0),
  item("LT-BAT20", "LED Batten 20W, 4 ft", "Lighting", "pc", 180, 279, 120, "S2", 210, 60, 35),
  item("WC-FR15", "FR Copper Wire 1.5 sq mm · 90 m", "Wires & Cables", "coil", 1180, 1540, 80, "S1", 140, 38, 20),
  item("WC-FR25", "FR Copper Wire 2.5 sq mm · 90 m", "Wires & Cables", "coil", 1890, 2420, 70, "S1", 46, 12, 6),
  item("SG-MCB32", "MCB 32A Single Pole, C-curve", "Switchgear", "pc", 148, 229, 40, "S3", 12, 6, 0),
  item("SG-DB08", "Distribution Box 8-way SPN", "Switchgear", "pc", 920, 1350, 15, "S3", 28, 9, 4),
  item("SG-RCCB40", "RCCB 40A 30mA Double Pole", "Switchgear", "pc", 1450, 2180, 10, "S3", 14, 4, 2),
  item("FN-CF1200", "Ceiling Fan 1200 mm, 3-blade", "Fans", "pc", 1640, 2290, 15, "S4", 6, 3, 0),
  item("FN-EX150", "Exhaust Fan 150 mm", "Fans", "pc", 690, 980, 20, "S4", 34, 12, 8),
  item("AC-SW6A", "Modular Switch 6A, 1-way", "Accessories", "pc", 28, 45, 600, "S5", 1450, 380, 260),
  item("AC-EXT4", "Extension Board 4-way, 2 m", "Accessories", "pc", 265, 399, 40, "S5", 72, 20, 14),
  item("AC-PVC20", "PVC Conduit 20 mm · 3 m", "Accessories", "pc", 38, 58, 300, "S5", 620, 140, 90),
];

const CUSTOMERS: Customer[] = [
  { id: "C1", name: "Roy Hardware Stores", city: "Bowbazar, Kolkata", contact: "Pranab Roy", phone: "+91 98310 22417", gstin: "19AAKFR2231L1ZQ" },
  { id: "C2", name: "Bose Constructions", city: "New Town, Kolkata", contact: "Ishita Bose", phone: "+91 90070 41862", gstin: "19AAGCB7720K1Z4" },
  { id: "C3", name: "Mitra Electric Works", city: "Shibpur, Howrah", contact: "Debashis Mitra", phone: "+91 98364 10593", gstin: "19ABZPM4418C1ZE" },
  { id: "C4", name: "Sunrise Builders", city: "Salt Lake, Kolkata", contact: "Kunal Agarwal", phone: "+91 83350 77204", gstin: "19AAMFS0392H1Z8" },
  { id: "C5", name: "Das Interiors", city: "Ballygunge, Kolkata", contact: "Moumita Das", phone: "+91 97481 30276", gstin: "19AFRPD6624N1ZK" },
  { id: "C6", name: "Patel Traders", city: "Benachity, Durgapur", contact: "Hitesh Patel", phone: "+91 94340 58819", gstin: "19AAQFP3157B1Z2" },
];

const SUPPLIERS: Supplier[] = [
  { id: "S1", name: "Bharat Cables Ltd", city: "Dankuni, Hooghly", contact: "R. K. Jain", phone: "+91 98300 61540", gstin: "19AABCB5521Q1ZT", leadDays: 4 },
  { id: "S2", name: "Lumina Lighting Co.", city: "Noida, UP", contact: "Neha Sharma", phone: "+91 98110 23687", gstin: "09AAECL8810R1ZB", leadDays: 6 },
  { id: "S3", name: "Shakti Switchgear Pvt Ltd", city: "Vadodara, GJ", contact: "Mehul Shah", phone: "+91 99250 44712", gstin: "24AAHCS3367J1ZM", leadDays: 7 },
  { id: "S4", name: "Vayu Appliances", city: "Taratala, Kolkata", contact: "Sanjay Kundu", phone: "+91 90381 77430", gstin: "19AAJFV1189D1Z6", leadDays: 3 },
  { id: "S5", name: "Eastern Polymers", city: "Bantala, Kolkata", contact: "Farhan Ali", phone: "+91 98745 30981", gstin: "19AACFE4473G1ZP", leadDays: 2 },
];

type Line = [sku: string, qty: number];
const price = (sku: string) => ITEMS.find((i) => i.sku === sku)!;
const saleLines = (lines: Line[]) => lines.map(([sku, qty]) => ({ sku, qty, rate: price(sku).price }));
const poLines = (lines: Line[]) => lines.map(([sku, qty]) => ({ sku, qty, rate: price(sku).cost }));

function so(id: string, date: string, customerId: string, godownId: SalesOrder["godownId"], lines: Line[], status: SalesOrder["status"], invoice = ""): SalesOrder {
  return { id, date, customerId, godownId, lines: saleLines(lines), status, invoice };
}

function po(id: string, date: string, supplierId: string, godownId: PurchaseOrder["godownId"], lines: Line[], expected: string, receivedOn?: string): PurchaseOrder {
  return { id, date, supplierId, godownId, lines: poLines(lines), status: receivedOn ? "Received" : "Pending", expected, receivedOn };
}

const SALES: SalesOrder[] = [
  so("SO-1024", "2026-10-14", "C5", "SLK", [["LT-LED09", 150], ["AC-EXT4", 20]], "Paid", "INV-2402"),
  so("SO-1027", "2026-10-28", "C2", "HWH", [["WC-FR15", 30], ["SG-MCB32", 50]], "Paid", "INV-2405"),
  so("SO-1031", "2026-11-04", "C2", "HWH", [["WC-FR15", 20], ["SG-DB08", 6]], "Paid", "INV-2409"),
  so("SO-1032", "2026-11-06", "C1", "HWH", [["LT-LED09", 200], ["AC-SW6A", 300]], "Paid", "INV-2410"),
  so("SO-1033", "2026-11-09", "C4", "SLK", [["LT-PNL18", 40], ["LT-BAT20", 30]], "Paid", "INV-2411"),
  so("SO-1034", "2026-11-12", "C6", "DGP", [["FN-CF1200", 10], ["FN-EX150", 6]], "Paid", "INV-2412"),
  so("SO-1035", "2026-11-15", "C3", "HWH", [["SG-MCB32", 60], ["SG-RCCB40", 8]], "Dispatched", "INV-2413"),
  so("SO-1036", "2026-11-18", "C5", "SLK", [["LT-PNL18", 24], ["AC-EXT4", 12]], "Dispatched", "INV-2414"),
  so("SO-1037", "2026-11-20", "C2", "HWH", [["WC-FR25", 30], ["WC-FR15", 25]], "Dispatched", "INV-2415"),
  so("SO-1038", "2026-11-22", "C1", "HWH", [["AC-PVC20", 200], ["AC-SW6A", 400]], "Paid", "INV-2416"),
  so("SO-1039", "2026-11-24", "C4", "SLK", [["FN-CF1200", 6], ["LT-LED09", 100]], "Confirmed"),
  so("SO-1040", "2026-11-25", "C3", "HWH", [["SG-MCB32", 10], ["SG-DB08", 4]], "Confirmed"),
  so("SO-1041", "2026-11-25", "C6", "DGP", [["LT-BAT20", 20], ["AC-EXT4", 10]], "Confirmed"),
];

const PURCHASES: PurchaseOrder[] = [
  po("PO-2205", "2026-10-21", "S4", "HWH", [["FN-CF1200", 30]], "2026-10-24", "2026-10-25"),
  po("PO-2207", "2026-11-03", "S1", "HWH", [["WC-FR15", 60], ["WC-FR25", 40]], "2026-11-07", "2026-11-07"),
  po("PO-2208", "2026-11-05", "S5", "HWH", [["AC-SW6A", 1000], ["AC-PVC20", 400]], "2026-11-07", "2026-11-08"),
  po("PO-2209", "2026-11-10", "S2", "SLK", [["LT-LED09", 300]], "2026-11-16", "2026-11-13"),
  po("PO-2210", "2026-11-14", "S3", "HWH", [["SG-RCCB40", 12], ["SG-DB08", 20]], "2026-11-21", "2026-11-19"),
  po("PO-2211", "2026-11-17", "S2", "HWH", [["LT-PNL18", 120], ["LT-BAT20", 80]], "2026-11-23"),
  po("PO-2212", "2026-11-20", "S3", "HWH", [["SG-MCB32", 120]], "2026-11-27"),
  po("PO-2213", "2026-11-23", "S4", "DGP", [["FN-CF1200", 24], ["FN-EX150", 10]], "2026-11-26"),
];

const TRANSFERS: Transfer[] = [
  { id: "TR-501", date: "2026-11-16", sku: "LT-LED09", from: "HWH", to: "SLK", qty: 100 },
  { id: "TR-502", date: "2026-11-21", sku: "AC-SW6A", from: "HWH", to: "DGP", qty: 200 },
];

const newestFirst = (a: { at: string }, b: { at: string }) => b.at.localeCompare(a.at);

/**
 * Builds the demo dataset. Stock movements and the activity feed are derived
 * from the orders above so every number in the app traces back to a document.
 */
export function createSeedState(): InventoryState {
  const items = structuredClone(ITEMS);
  const sales = structuredClone(SALES);
  const purchases = structuredClone(PURCHASES);
  const customerName = (id: string) => CUSTOMERS.find((c) => c.id === id)!.name;
  const supplierName = (id: string) => SUPPLIERS.find((s) => s.id === id)!.name;

  const activity: Activity[] = [];
  const movements: StockMovement[] = [];

  sales.forEach((o, k) => {
    const minute = ((k * 7) % 50) + 5;
    const amount = formatMoney(orderTotal(o.lines));
    activity.push({ at: stamp(o.date, o.date === TODAY ? 9 : 10, minute), kind: "sale", title: `${o.id} booked · ${customerName(o.customerId)}`, meta: amount });

    if (o.status !== "Confirmed") {
      const at = stamp(o.date, 15, minute);
      o.dispatchedOn = o.date;
      o.lines.forEach((l) => movements.push({ at, sku: l.sku, godownId: o.godownId, qty: -l.qty, type: "Sale", ref: o.invoice }));
      activity.push({ at, kind: "dispatch", title: `${o.invoice} dispatched from ${godown(o.godownId).short}`, meta: `${o.id} · ${customerName(o.customerId)}` });
    }
    if (o.status === "Paid") {
      const paidOn = [addDays(o.date, 3), addDays(TODAY, -1)].sort()[0];
      o.paidOn = paidOn;
      activity.push({ at: stamp(paidOn, 12, minute), kind: "pay", title: `Payment received · ${customerName(o.customerId)}`, meta: `${o.invoice} · ${amount}` });
    }
  });

  purchases.forEach((p, k) => {
    const minute = ((k * 11) % 50) + 3;
    activity.push({ at: stamp(p.date, 11, minute), kind: "po", title: `${p.id} raised · ${supplierName(p.supplierId)}`, meta: formatMoney(orderTotal(p.lines)) });
    if (p.receivedOn) {
      const at = stamp(p.receivedOn, 14, minute);
      p.lines.forEach((l) => movements.push({ at, sku: l.sku, godownId: p.godownId, qty: l.qty, type: "Purchase", ref: p.id }));
      activity.push({ at, kind: "receive", title: `${p.id} received at ${godown(p.godownId).short}`, meta: `${formatNumber(units(p.lines))} units added` });
    }
  });

  TRANSFERS.forEach((t) => {
    const at = stamp(t.date, 13, 20);
    movements.push({ at, sku: t.sku, godownId: t.from, qty: -t.qty, type: "Transfer out", ref: t.id });
    movements.push({ at, sku: t.sku, godownId: t.to, qty: t.qty, type: "Transfer in", ref: t.id });
    activity.push({ at, kind: "transfer", title: `${t.id} · ${godown(t.from).short} → ${godown(t.to).short}`, meta: `${t.qty} × ${price(t.sku).name}` });
  });

  activity.push({ at: stamp(TODAY, 9, 2), kind: "alert", title: "Low stock · MCB 32A Single Pole, C-curve", meta: "18 pc left, minimum 40" });

  return {
    items,
    customers: structuredClone(CUSTOMERS),
    suppliers: structuredClone(SUPPLIERS),
    sales,
    purchases,
    transfers: structuredClone(TRANSFERS),
    movements: movements.sort(newestFirst),
    activity: activity.sort(newestFirst),
    counters: { sale: 1042, purchase: 2214, invoice: 2417, transfer: 503 },
  };
}
