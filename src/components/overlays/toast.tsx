"use client";

import { CircleCheck, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Toast as ToastData } from "@/components/providers/ui-provider";

/**
 * Rendered as a manual popover so it joins the browser's top layer and
 * appears above an open drawer or modal (which are native dialogs).
 */
export function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && typeof el.showPopover === "function" && !el.matches(":popover-open")) el.showPopover();
  }, []);

  return (
    <div
      ref={ref}
      popover="manual"
      role="status"
      aria-live="polite"
      style={{ inset: "auto", bottom: 28, left: "50%" }}
      className="fixed m-0 flex w-max max-w-[min(560px,calc(100%-32px))] -translate-x-1/2 animate-toast-in items-start gap-2.5 rounded-xl border-0 bg-ink py-3 pr-2 pl-4 text-[13.5px] leading-[1.45] text-white shadow-[0_16px_40px_rgb(14_20_36/0.3)]"
    >
      {toast.tone === "error" ? (
        <TriangleAlert aria-hidden className="mt-px size-[18px] shrink-0 text-[#ff8a80]" />
      ) : (
        <CircleCheck aria-hidden className="mt-px size-[18px] shrink-0 text-[#5fe3a1]" />
      )}
      <span>{toast.text}</span>
      <button type="button" aria-label="Dismiss" onClick={onDismiss} className="-my-0.5 rounded-md p-0.5 text-white/60 hover:text-white">
        <X className="size-4" />
      </button>
    </div>
  );
}
