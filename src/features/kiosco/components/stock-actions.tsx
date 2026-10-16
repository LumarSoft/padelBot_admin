"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/features/productos/hooks/use-products";
import { CountDialog } from "@/features/kiosco/components/count-dialog";
import { useFeature } from "@/features/plan/hooks/use-plan";

/**
 * «Contar stock», next to the screen's title. Charging and loading deliveries happen in the
 * «Mostrador» tab (the point of sale); the count stays a sheet of its own because it's done
 * shelf in hand, product by product.
 */
export function StockActions() {
  const { data } = useProducts();
  const [open, setOpen] = useState(false);
  // Without kiosk stock in the plan a count can't START tracking a product (the API refuses
  // it); products a club already tracks keep it.
  const canTrack = useFeature("kioscoStock").enabled;
  const products = (data ?? []).filter(
    (p) => p.isActive && (canTrack || p.stockQuantity !== null),
  );

  if (products.length === 0) return null;

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} data-help="kiosco-contar">
        <ClipboardList className="size-4" />
        Contar stock
      </Button>
      <CountDialog products={products} open={open} onOpenChange={setOpen} />
    </>
  );
}
