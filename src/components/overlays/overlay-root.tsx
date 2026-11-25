"use client";

import { useUI } from "@/components/providers/ui-provider";
import { ItemDrawer } from "./item-drawer";
import { OrderDrawer } from "./order-drawer";
import { PurchaseForm } from "./purchase-form";
import { SaleForm } from "./sale-form";
import { TransferForm } from "./transfer-form";

/** Renders whichever detail sheet and form are currently open. */
export function OverlayRoot() {
  const { drawer, modal, closeDrawer, closeModal } = useUI();

  return (
    <>
      {drawer?.type === "item" && <ItemDrawer key={drawer.sku} sku={drawer.sku} onClose={closeDrawer} />}
      {drawer?.type === "sale" && <OrderDrawer key={drawer.id} kind="sale" id={drawer.id} onClose={closeDrawer} />}
      {drawer?.type === "purchase" && <OrderDrawer key={drawer.id} kind="purchase" id={drawer.id} onClose={closeDrawer} />}

      {modal?.type === "sale" && <SaleForm onClose={closeModal} />}
      {modal?.type === "purchase" && <PurchaseForm sku={modal.sku} onClose={closeModal} />}
      {modal?.type === "transfer" && <TransferForm sku={modal.sku} from={modal.from} onClose={closeModal} />}
    </>
  );
}
