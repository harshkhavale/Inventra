"use client";

import { ArrowLeftRight, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { OverlayRoot } from "@/components/overlays/overlay-root";
import { useUI } from "@/components/providers/ui-provider";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { COMPANY, FINANCIAL_YEAR, TODAY_LABEL } from "@/lib/constants";
import { AppSidebar } from "./app-sidebar";
import { titleFor } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openModal } = useUI();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b bg-card/90 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:inline-flex">{COMPANY}</BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">{titleFor(pathname)}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-[13px] text-muted-foreground xl:inline">
              {TODAY_LABEL} · {FINANCIAL_YEAR}
            </span>
            <Button variant="outline" size="sm" onClick={() => openModal({ type: "transfer" })}>
              <ArrowLeftRight />
              <span className="sr-only sm:not-sr-only">Transfer</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => openModal({ type: "purchase" })}>
              <Plus />
              <span className="sr-only sm:not-sr-only">Purchase order</span>
            </Button>
            <Button size="sm" onClick={() => openModal({ type: "sale" })}>
              <Plus />
              Sales order
            </Button>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 pt-7 pb-14 sm:px-8">{children}</main>
      </SidebarInset>

      <OverlayRoot />
      <Toaster position="bottom-center" richColors />
    </SidebarProvider>
  );
}
