"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { useProducts } from "@/features/productos/hooks/use-products";
import { useSetBookingProducts } from "@/features/reservas/hooks/use-bookings";
import { CATEGORY_LABELS, type ProductCategory } from "@/types/api/products";
import type { BookingProductEntry } from "@/types/api/bookings";
import type { Product } from "@/types/api/products";

const CATEGORY_ORDER: ProductCategory[] = [
  "PELOTA",
  "BEBIDA",
  "SNACK",
  "ACCESORIO",
  "OTRO",
];

function QuantityControl({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        disabled={disabled || value <= 0}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-3" />
      </Button>
      <span className="w-6 text-center text-sm tabular-nums font-medium">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}

export function AddProductsDialog({
  bookingId,
  playerName,
  currentProducts,
  open,
  onOpenChange,
}: {
  bookingId: string;
  playerName: string;
  currentProducts: BookingProductEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: catalog, isLoading } = useProducts();
  const setProducts = useSetBookingProducts();

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const entry of currentProducts) {
      initial[entry.product.id] = entry.quantity;
    }
    return initial;
  });

  const activeProducts = (catalog ?? []).filter((p) => p.isActive);

  const byCategory = activeProducts.reduce<Record<string, Product[]>>(
    (acc, p) => {
      acc[p.category] = [...(acc[p.category] ?? []), p];
      return acc;
    },
    {},
  );

  const items = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const subtotal = items.reduce((sum, item) => {
    const product = activeProducts.find((p) => p.id === item.productId);
    return sum + (product?.priceCents ?? 0) * item.quantity;
  }, 0);

  function handleSave() {
    setProducts.mutate(
      { bookingId, body: { items } },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBasket className="size-5" />
            Consumos de {playerName}
          </DialogTitle>
          <DialogDescription>
            Seleccioná los productos consumidos durante el turno. Se guardan en
            la reserva para tu control interno.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Cargando catálogo…
          </div>
        ) : activeProducts.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No hay productos activos en el catálogo.
            <br />
            Agregá productos en la sección Productos.
          </p>
        ) : (
          <div className="flex flex-col gap-4 py-1 max-h-[60vh] overflow-y-auto pr-1">
            {CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map(
              (cat) => (
                <div key={cat}>
                  <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <div className="flex flex-col gap-1">
                    {byCategory[cat].map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatPrice(product.priceCents)} c/u
                          </p>
                        </div>
                        <QuantityControl
                          value={quantities[product.id] ?? 0}
                          onChange={(v) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [product.id]: v,
                            }))
                          }
                          disabled={setProducts.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {subtotal > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total consumos ({items.reduce((s, i) => s + i.quantity, 0)}{" "}
                ítems)
              </span>
              <span className="font-semibold tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={setProducts.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={setProducts.isPending || activeProducts.length === 0}
          >
            {setProducts.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar consumos"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
