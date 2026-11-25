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
            <div className="text-base font-bold tracking-tight text-foreground">Inventra</div>
            <div className="truncate text-xs text-muted-foreground">{COMPANY}</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {NAV.map((group) => (
          <SidebarGroup key={group.group} className="py-1">
            <SidebarGroupLabel className="tracking-[0.08em] text-muted-foreground uppercase">{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const count = item.badge ? counts[item.badge] : 0;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} className="h-9 font-medium data-[active=true]:bg-card data-[active=true]:font-semibold data-[active=true]:shadow-card">
                        <Link href={item.href} onClick={() => isMobile && setOpenMobile(false)}>
                          <Icon className={cn(active && "text-sidebar-ring")} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {count > 0 && (
                        <SidebarMenuBadge
                          aria-label={`${count} need attention`}
                          className={cn("top-2 rounded-full", item.badge === "stock" ? "bg-warning-soft text-warning" : "bg-card text-foreground shadow-xs")}
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
        <div className="rounded-xl border bg-card p-3 shadow-card">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-[34px]">
              <AvatarFallback className="bg-info-soft text-[13px] font-bold text-info">AS</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold text-foreground">Arjun Sen</div>
              <div className="text-xs text-muted-foreground">Owner · Admin</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetDemo}
            className="mt-3 w-full text-xs"
          >
            <RotateCcw /> Reset demo data
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
