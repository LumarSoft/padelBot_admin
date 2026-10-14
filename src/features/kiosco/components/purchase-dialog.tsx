"use client";

import { useState } from "react";
import { Loader2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRegisterPurchase } from "@/features/kiosco/hooks/use-stock";
import {
  ProductQuantityList,
  parseQuantity,
  type QuantityListProduct,
} from "@/features/kiosco/components/product-quantity-list";

/** "Entró mercadería": one delivery, many products — only the ones with a quantity count. */
export function PurchaseDialog({
  products,
  open,
  onOpenChange,
}: {
  products: QuantityListProduct[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const registerPurchase = useRegisterPurchase();

  const items = products
    .map((p) => ({ productId: p.id, quantity: parseQuantity(values[p.id]) ?? 0 }))
    .filter((item) => item.quantity > 0);
  const units = items.reduce((sum, item) => sum + item.quantity, 0);

  function close(next: boolean) {
    if (!next) {
      setValues({});
      setNote("");
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    if (items.length === 0) return;
    registerPurchase.mutate(
      { items, note: note.trim() || undefined },
      { onSuccess: () => close(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="size-5" />
            Entró mercadería
          </DialogTitle>
          <DialogDescription>
            Anotá cuánto llegó de cada producto. Lo que dejes vacío no se toca.
          </DialogDescription>
        </DialogHeader>

        <ProductQuantityList
          products={products}
          values={values}
          onChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))}
          disabled={registerPurchase.isPending}
        />

        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="Proveedor o remito (opcional)"
          disabled={registerPurchase.isPending}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={registerPurchase.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={registerPurchase.isPending || items.length === 0}
          >
            {registerPurchase.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : items.length === 0 ? (
              "Sumar al stock"
            ) : (
              `Sumar ${units} ${units === 1 ? "unidad" : "unidades"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
