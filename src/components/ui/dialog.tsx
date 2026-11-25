"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./button";
import { Eyebrow } from "./page-header";

/**
 * Built on the native <dialog> element, which gives us a focus trap, Escape
 * to close and an inert background for free.
 */
function useModalDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);
  const props = {
    ref,
    onCancel: (e: React.SyntheticEvent) => {
      e.preventDefault();
      onClose();
    },
    // A click whose target is the <dialog> itself landed on the backdrop.
    onClick: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
  };
  return props;
}

function DialogHeader({ eyebrow, title, onClose, children }: { eyebrow: string; title: React.ReactNode; onClose: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line-soft px-6 pt-[22px] pb-4">
      <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-xl font-[650] tracking-[-0.01em]">{title}</h2>
        {children}
      </div>
      <IconButton aria-label="Close" onClick={onClose}>
        <X className="size-4" />
      </IconButton>
    </div>
  );
}

export function Modal({
  eyebrow,
  title,
  onClose,
  footer,
  children,
  width = 720,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}) {
  const dialog = useModalDialog(onClose);
  return (
    <dialog
      {...dialog}
      aria-label={title}
      style={{ width: `min(${width}px, calc(100% - 32px))` }}
      className="m-auto max-h-[calc(100dvh-32px)] animate-pop-in overflow-y-auto rounded-[18px] bg-white p-0 text-ink shadow-pop backdrop:animate-fade-in backdrop:bg-ink/40"
    >
      <DialogHeader eyebrow={eyebrow} title={title} onClose={onClose} />
      <div className="flex flex-col gap-[18px] px-6 py-5">{children}</div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-6 pt-4 pb-[22px]">{footer}</div>
    </dialog>
  );
}

export function Drawer({
  eyebrow,
  title,
  badge,
  onClose,
  children,
  label,
  titleClassName,
}: {
  eyebrow: string;
  title: string;
  badge?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  label: string;
  titleClassName?: string;
}) {
  const dialog = useModalDialog(onClose);
  return (
    <dialog
      {...dialog}
      aria-label={label}
      className="m-0 ml-auto h-dvh max-h-dvh w-[min(580px,100%)] max-w-full animate-slide-in overflow-y-auto bg-white p-0 text-ink shadow-drawer backdrop:animate-fade-in backdrop:bg-ink/40"
    >
      <DialogHeader eyebrow={eyebrow} title={<span className={cn(titleClassName)}>{title}</span>} onClose={onClose}>
        {badge && <div className="mt-2.5">{badge}</div>}
      </DialogHeader>
      <div className="flex flex-col gap-[22px] px-6 py-5">{children}</div>
    </dialog>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("mb-3 text-sm font-semibold tracking-[-0.01em]", className)}>{children}</h3>;
}

/** Subtotal / GST / Total block used on orders and order forms. */
export function Totals({ subtotal, gst, total }: { subtotal: string; gst: string; total: string }) {
  return (
    <dl className="ml-auto flex w-[min(280px,100%)] flex-col gap-1.5 text-[13.5px]">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd className="tabular">{subtotal}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">GST 18%</dt>
        <dd className="tabular">{gst}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-2 text-base font-[650]">
        <dt>Total</dt>
        <dd className="tabular">{total}</dd>
      </div>
    </dl>
  );
}
