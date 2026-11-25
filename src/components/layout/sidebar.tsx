"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useCommands } from "@/hooks/use-commands";
import { COMPANY } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { confirmedSales, lowStockItems, pendingPurchases } from "@/lib/selectors";
import { useInventory } from "@/store/inventory-store";
import { NAV, type BadgeKey } from "./nav";

export function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <rect width="34" height="34" rx="9" fill="#3047D6" />
      <path d="M10 13.5l7-3.8 7 3.8-7 3.8z" fill="#fff" />
      <path d="M10 17.5l7 3.8 7-3.8M10 21l7 3.8 7-3.8" fill="none" stroke="#C7D0FF" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const state = useInventory();
  const { resetDemo } = useCommands();

  const counts: Record<BadgeKey, number> = {
    sales: confirmedSales(state).length,
    purchases: pendingPurchases(state).length,
    stock: lowStockItems(state).length,
  };

  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-1 bg-nav px-3.5 py-5 text-white">
      <div className="flex items-center gap-3 px-2.5 pt-1 pb-3.5">
        <Logo />
        <div className="min-w-0">
          <div className="text-base font-bold tracking-[-0.01em]">Inventra</div>
          <div className="truncate text-xs text-[#9aa3b5]">{COMPANY}</div>
        </div>
      </div>

      {NAV.map((group) => (
        <div key={group.group}>
          <div className="mx-3 mt-[18px] mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-faint uppercase">{group.group}</div>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const count = item.badge ? counts[item.badge] : 0;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      active ? "bg-nav-active text-white" : "text-nav-text hover:bg-nav-hover hover:text-white",
                    )}
                  >
                    <Icon aria-hidden className={cn("size-[18px]", active && "text-[#8fa2ff]")} strokeWidth={1.75} />
                    {item.label}
                    {count > 0 && (
                      <span
                        className={cn(
                          "tabular ml-auto inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11.5px] font-semibold",
                          item.badge === "stock" ? "bg-[#5a3a0c] text-[#ffd9a0]" : "bg-[#2e3750] text-[#e4e8f2]",
                        )}
                        aria-label={`${count} need attention`}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="min-h-6 flex-1" />

      <div className="rounded-xl bg-nav-raised p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-[34px] items-center justify-center rounded-full bg-[#2e3a63] text-[13px] font-bold text-[#dce2ff]">AS</div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold">Arjun Sen</div>
            <div className="text-xs text-[#9aa3b5]">Owner · Admin</div>
          </div>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-xs font-medium text-nav-text transition-colors hover:bg-nav-hover hover:text-white"
        >
          <RotateCcw aria-hidden className="size-3.5" /> Reset demo data
        </button>
      </div>
    </nav>
  );
}
