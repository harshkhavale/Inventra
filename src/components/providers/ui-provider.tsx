"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { GodownId } from "@/lib/types";

export type DrawerState =
  | { type: "item"; sku: string }
  | { type: "sale"; id: string }
  | { type: "purchase"; id: string };

export type ModalState =
  | { type: "sale" }
  | { type: "purchase"; sku?: string }
  | { type: "transfer"; sku?: string; from?: GodownId };

export interface Toast {
  id: number;
  text: string;
  tone: "success" | "error";
}

interface UIContextValue {
  drawer: DrawerState | null;
  modal: ModalState | null;
  toast: Toast | null;
  openDrawer: (d: DrawerState) => void;
  closeDrawer: () => void;
  /** Opening a form closes any drawer so there is only ever one layer. */
  openModal: (m: ModalState) => void;
  closeModal: () => void;
  notify: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

const TOAST_MS = 4200;

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((text: string, tone: Toast["tone"] = "success") => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), text, tone });
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      drawer,
      modal,
      toast,
      openDrawer: setDrawer,
      closeDrawer: () => setDrawer(null),
      openModal: (m) => {
        setDrawer(null);
        setModal(m);
      },
      closeModal: () => setModal(null),
      notify,
      dismissToast: () => setToast(null),
    }),
    [drawer, modal, toast, notify],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}
