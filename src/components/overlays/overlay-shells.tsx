"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Eyebrow } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

/** Right-hand detail panel. shadcn Sheet, always open while mounted. */
export function DetailSheet({
  eyebrow,
  title,
  badge,
  description,
  onClose,
  children,
  titleClassName,
}: {
  eyebrow: string;
  title: string;
  badge?: React.ReactNode;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
  titleClassName?: string;
}) {
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-card sm:max-w-[580px]">
        <SheetHeader className="gap-0 border-b px-6 pt-6 pb-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <SheetTitle className={cn("pr-8 text-xl font-semibold", titleClassName)}>{title}</SheetTitle>
          <SheetDescription className="sr-only">{description}</SheetDescription>
          {badge && <div className="mt-2.5">{badge}</div>}
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 py-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

/** Form in a centred shadcn Dialog with a sticky-feeling footer. */
export function FormDialog({
  eyebrow,
  title,
  description,
  onClose,
  footer,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto bg-card p-0 sm:max-w-[720px]", className)}>
        <DialogHeader className="gap-0 border-b px-6 pt-6 pb-4 text-left">
          <Eyebrow>{eyebrow}</Eyebrow>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="mt-1">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 px-6 py-5">{children}</div>
        <DialogFooter className="border-t px-6 py-4">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
