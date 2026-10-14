"use client";

import { useState } from "react";
import { ClipboardList, PackagePlus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/features/productos/hooks/use-products";
import { PurchaseDialog } from "@/features/kiosco/components/purchase-dialog";
import { CountDialog } from "@/features/kiosco/components/count-dialog";
import { CounterSaleDialog } from "@/features/kiosco/components/counter-sale-dialog";
import { useFeature } from "@/features/plan/hooks/use-plan";

type Open = "sale" | "purchase" | "count" | null;

/** The three things the front desk does with the kiosk, as buttons. Active products only. */
export function StockActions() {
  const { data } = useProducts();
  const [open, setOpen] = useState<Open>(null);
  const products = (data ?? []).filter((p) => p.isActive);
  // Without kiosk stock in the plan, deliveries and counts can't START tracking a product (the
  // API refuses it); products a club already tracks keep both.
  const canTrack = useFeature("kioscoStock").enabled;
  const stockProducts = canTrack ? products : products.filter((p) => p.stockQuantity !== null);
  const onOpenChange = (next: boolean) => {
    if (!next) setOpen(null);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen("sale")}>
        <ShoppingBag className="size-4" />
        Venta suelta
      </Button>
      {stockProducts.length > 0 && (
        <>
          <Button size="sm" variant="outline" onClick={() => setOpen("purchase")}>
            <PackagePlus className="size-4" />
            Entró mercadería
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen("count")}>
            <ClipboardList className="size-4" />
            Contar stock
          </Button>
        </>
      )}

      <CounterSaleDialog products={products} open={open === "sale"} onOpenChange={onOpenChange} />
      <PurchaseDialog products={stockProducts} open={open === "purchase"} onOpenChange={onOpenChange} />
      <CountDialog products={stockProducts} open={open === "count"} onOpenChange={onOpenChange} />
    </>
  );
}
