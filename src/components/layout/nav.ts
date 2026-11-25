import {
  ChartColumn,
  LayoutGrid,
  Package,
  ReceiptText,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type BadgeKey = "sales" | "purchases" | "stock";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: BadgeKey;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Overview", items: [{ href: "/", label: "Dashboard", icon: LayoutGrid }] },
  {
    group: "Operations",
    items: [
      { href: "/sales", label: "Sales", icon: ReceiptText, badge: "sales" },
      { href: "/purchases", label: "Purchases", icon: Truck, badge: "purchases" },
      { href: "/stock", label: "Stock", icon: Package, badge: "stock" },
      { href: "/godowns", label: "Godowns", icon: Warehouse },
    ],
  },
  { group: "Directory", items: [{ href: "/directory", label: "Customers & suppliers", icon: Users }] },
  { group: "Insights", items: [{ href: "/reports", label: "Reports", icon: ChartColumn }] },
];

export function titleFor(pathname: string): string {
  for (const g of NAV) {
    for (const i of g.items) {
      if (i.href === pathname || (i.href !== "/" && pathname.startsWith(i.href))) return i.label;
    }
  }
  return "Dashboard";
}
