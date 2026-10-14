"use client";

import { useState } from "react";
import { ClipboardList, PackagePlus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/features/productos/hooks/use-products";
import { PurchaseDialog } from "@/features/kiosco/components/purchase-dialog";
import { CountDialog } from "@/features/kiosco/components/count-dialog";
import { CounterSaleDialog } from "@/features/kiosco/components/counter-sale-dialog";

type Open = "sale" | "purchase" | "count" | null;

/** The three things the front desk does with the kiosk, as buttons. Active products only. */
export function StockActions() {
  const { data } = useProducts();
  const [open, setOpen] = useState<Open>(null);
  const products = (data ?? []).filter((p) => p.isActive);
  const onOpenChange = (next: boolean) => {
    if (!next) setOpen(null);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen("sale")}>
        <ShoppingBag className="size-4" />
        Venta suelta
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpen("purchase")}>
        <PackagePlus className="size-4" />
        Entró mercadería
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpen("count")}>
        <ClipboardList className="size-4" />
        Contar stock
      </Button>

      <CounterSaleDialog products={products} open={open === "sale"} onOpenChange={onOpenChange} />
      <PurchaseDialog products={products} open={open === "purchase"} onOpenChange={onOpenChange} />
      <CountDialog products={products} open={open === "count"} onOpenChange={onOpenChange} />
    </>
  );
}
