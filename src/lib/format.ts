import { TODAY } from "./constants";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 125000 → "1,25,000" (Indian digit grouping). */
export function formatNumber(n: number): string {
  return inr.format(Math.round(n));
}

/** 125000 → "₹1,25,000" */
export function formatMoney(n: number): string {
  return "₹" + formatNumber(n);
}

/** Lakh / crore shorthand for headline figures: 1250000 → "₹12.50 L". */
export function formatCompactMoney(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return formatMoney(n);
}

export function formatSigned(n: number): string {
  return (n >= 0 ? "+" : "−") + formatNumber(Math.abs(n));
}

/** "2026-11-04" → "4 Nov" or "4 Nov 2026". */
export function formatDate(iso: string | undefined, withYear = false): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]}${withYear ? ` ${y}` : ""}`;
}

/** "2026-11-25T14:05:00" → "Today, 2:05 pm". */
export function formatDateTime(at: string): string {
  const day = at.slice(0, 10);
  let h = parseInt(at.slice(11, 13), 10);
  const min = at.slice(14, 16);
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  const label = day === TODAY ? "Today" : day === addDays(TODAY, -1) ? "Yesterday" : formatDate(day);
  return `${label}, ${h}:${min} ${ampm}`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Timestamp on the business date using the wall-clock time of the action. */
export function nowStamp(): string {
  const d = new Date();
  return `${TODAY}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function stamp(date: string, hour: number, minute: number): string {
  return `${date}T${pad(hour)}:${pad(minute)}:00`;
}

/** Share of a in b as a 0–100 number, clamped. */
export function percent(a: number, b: number): number {
  return b > 0 ? Math.max(0, Math.min(100, (a / b) * 100)) : 0;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
