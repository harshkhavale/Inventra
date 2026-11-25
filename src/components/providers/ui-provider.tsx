"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { GodownId } from "@/lib/types";

export type DrawerState =
  | { type: "item"; sku: string }
  | { type: "sale"; id: string }
  | { type: "purchase"; id: string };

export type ModalState =
  | { type: "sale" }
  | { type: "purchase"; sku?: string }
  | { type: "transfer"; sku?: string; from?: GodownId };

interface UIContextValue {
  drawer: DrawerState | null;
  modal: ModalState | null;
  openDrawer: (d: DrawerState) => void;
  closeDrawer: () => void;
  /** Opening a form closes any drawer so there is only ever one layer. */
  openModal: (m: ModalState) => void;
  closeModal: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

/** Which detail sheet and which form are open. Toasts go through Sonner. */
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  const value = useMemo<UIContextValue>(
    () => ({
      drawer,
      modal,
      openDrawer: setDrawer,
      closeDrawer: () => setDrawer(null),
      openModal: (m) => {
        setDrawer(null);
        setModal(m);
      },
      closeModal: () => setModal(null),
    }),
    [drawer, modal],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}
