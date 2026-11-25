"use client";

import { ArrowLeftRight, ChevronRight, Menu, Plus, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { OverlayRoot } from "@/components/overlays/overlay-root";
import { useUI } from "@/components/providers/ui-provider";
import { Button, IconButton } from "@/components/ui/button";
import { COMPANY, FINANCIAL_YEAR, TODAY_LABEL } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { titleFor } from "./nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openModal } = useUI();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 overflow-y-auto lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", menuOpen ? "visible" : "invisible")} inert={!menuOpen}>
        <div className={cn("absolute inset-0 bg-ink/40 transition-opacity", menuOpen ? "opacity-100" : "opacity-0")} onClick={() => setMenuOpen(false)} />
        <aside className={cn("absolute inset-y-0 left-0 w-[264px] overflow-y-auto transition-transform", menuOpen ? "translate-x-0" : "-translate-x-full")}>
          <Sidebar onNavigate={() => setMenuOpen(false)} />
          <IconButton aria-label="Close menu" onClick={() => setMenuOpen(false)} className="absolute top-5 right-3 border-white/10 bg-nav-raised text-white hover:bg-nav-hover">
            <X className="size-4" />
          </IconButton>
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/90 px-4 py-3.5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2 text-[13.5px]">
            <IconButton aria-label="Open menu" className="-ml-1 lg:hidden" onClick={() => setMenuOpen(true)}>
              <Menu className="size-[18px]" />
            </IconButton>
            <span className="hidden text-muted sm:inline">{COMPANY}</span>
            <ChevronRight aria-hidden className="hidden size-3.5 text-[#9aa3b5] sm:block" />
            <span className="font-semibold">{titleFor(pathname)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="hidden text-[13px] text-muted xl:inline">
              {TODAY_LABEL} · {FINANCIAL_YEAR}
            </span>
            <Button size="sm" onClick={() => openModal({ type: "transfer" })}>
              <ArrowLeftRight aria-hidden className="size-[15px]" />
              <span className="hidden sm:inline">Transfer</span>
            </Button>
            <Button size="sm" onClick={() => openModal({ type: "purchase" })}>
              <Plus aria-hidden className="size-[15px]" />
              <span className="sr-only sm:not-sr-only">Purchase order</span>
            </Button>
            <Button size="sm" variant="primary" onClick={() => openModal({ type: "sale" })}>
              <Plus aria-hidden className="size-[15px]" />
              Sales order
            </Button>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 pt-7 pb-14 sm:px-8">{children}</main>
      </div>

      <OverlayRoot />
    </div>
  );
}
