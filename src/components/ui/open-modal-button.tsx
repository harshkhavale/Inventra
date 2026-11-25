"use client";

import { ArrowLeftRight, Plus } from "lucide-react";
import { useUI, type ModalState } from "@/components/providers/ui-provider";
import { Button } from "./button";

/** Header action that opens one of the global forms. Lets page headers stay server components. */
export function OpenModalButton({ modal, children }: { modal: ModalState; children: React.ReactNode }) {
  const { openModal } = useUI();
  const Icon = modal.type === "transfer" ? ArrowLeftRight : Plus;
  return (
    <Button variant="primary" onClick={() => openModal(modal)}>
      <Icon aria-hidden className="size-4" />
      {children}
    </Button>
  );
}
