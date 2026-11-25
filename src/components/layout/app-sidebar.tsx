"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCommands } from "@/hooks/use-commands";
import { COMPANY } from "@/lib/constants";
import { confirmedSales, lowStockItems, pendingPurchases } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { useInventory } from "@/store/inventory-store";
import { NAV, type BadgeKey } from "./nav";

export function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 34 34" aria-hidden className="shrink-0">
      <rect width="34" height="34" rx="9" fill="#3047D6" />
      <path d="M10 13.5l7-3.8 7 3.8-7 3.8z" fill="#fff" />
      <path d="M10 17.5l7 3.8 7-3.8M10 21l7 3.8 7-3.8" fill="none" stroke="#C7D0FF" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Main navigation. shadcn Sidebar: fixed on desktop, a sheet on mobile. */
export function AppSidebar() {
  const pathname = usePathname();
  const state = useInventory();
  const { resetDemo } = useCommands();
  const { isMobile, setOpenMobile } = useSidebar();

  const counts: Record<BadgeKey, number> = {
    sales: confirmedSales(state).length,
    purchases: pendingPurchases(state).length,
    stock: lowStockItems(state).length,
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-5 pb-1">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="min-w-0">
            <div className="text-base font-bold tracking-tight text-white">Inventra</div>
            <div className="truncate text-xs text-sidebar-muted">{COMPANY}</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {NAV.map((group) => (
          <SidebarGroup key={group.group} className="py-1">
            <SidebarGroupLabel className="tracking-[0.08em] text-sidebar-muted uppercase">{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const count = item.badge ? counts[item.badge] : 0;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} className="h-9 font-medium transition-colors hover:text-white data-[active=true]:bg-primary/20 data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-[inset_0_0_0_1px_rgb(143_162_255/0.22),0_0_18px_-6px_rgb(48_71_214/0.7)]">
                        <Link href={item.href} onClick={() => isMobile && setOpenMobile(false)}>
                          <Icon className={cn(active && "text-sidebar-ring")} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {count > 0 && (
                        <SidebarMenuBadge
                          aria-label={`${count} need attention`}
                          className={cn("top-2 rounded-full", item.badge === "stock" ? "bg-warning-fill/20 text-[#ffc56b]" : "bg-white/10 text-white")}
                        >
                          {count}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-[34px]">
              <AvatarFallback className="bg-primary/30 text-[13px] font-bold text-[#dce2ff]">AS</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold text-white">Arjun Sen</div>
              <div className="text-xs text-sidebar-muted">Owner · Admin</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetDemo}
            className="mt-3 w-full border-white/10 bg-transparent text-xs text-sidebar-foreground hover:bg-white/10 hover:text-white"
          >
            <RotateCcw /> Reset demo data
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
