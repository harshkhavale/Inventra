"use client";

import { toast } from "sonner";
import * as commands from "@/store/commands";
import type { Outcome } from "@/store/commands";
import { inventoryStore } from "@/store/inventory-store";

/**
 * Binds the pure workflow commands to the store and to Sonner toasts.
 *
 * Row actions (dispatch, receive, mark paid) report errors as a toast.
 * Form submissions return the error instead, so the form can show it inline
 * and stay open.
 */
export function useCommands() {
  const commit = (outcome: Outcome) => {
    if (!outcome.ok) return outcome.error;
    inventoryStore.setState(outcome.state);
    if (outcome.tone === "error") toast.error(outcome.message);
    else toast.success(outcome.message);
    return null;
  };

  const act = (outcome: Outcome) => {
    const error = commit(outcome);
    if (error) toast.error(error);
  };

  const state = inventoryStore.getState;

  return {
    dispatchSale: (id: string) => act(commands.dispatchSale(state(), id)),
    markSalePaid: (id: string) => act(commands.markSalePaid(state(), id)),
    receivePurchase: (id: string) => act(commands.receivePurchase(state(), id)),
    createSale: (draft: commands.SaleDraft, dispatchNow: boolean) => commit(commands.createSale(state(), draft, dispatchNow)),
    createPurchase: (draft: commands.PurchaseDraft) => commit(commands.createPurchase(state(), draft)),
    transferStock: (draft: commands.TransferDraft) => commit(commands.transferStock(state(), draft)),
    resetDemo: () => {
      inventoryStore.reset();
      toast.success("Demo data restored to its starting point.");
    },
  };
}
