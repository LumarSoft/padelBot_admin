"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Landmark,
  Loader2,
  Minus,
  Plus,
  QrCode,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { useCreateCounterSale } from "@/features/kiosco/hooks/use-stock";
import { stockWarning } from "@/features/kiosco/lib/stock-warning";
import { CATEGORY_LABELS, type Product, type ProductCategory } from "@/types/api/products";
import type { PlayerPaymentMethod } from "@/types/api/bookings";

const CATEGORY_ORDER: ProductCategory[] = [
  "PELOTA",
  "BEBIDA",
  "SNACK",
  "ACCESORIO",
  "OTRO",
];

const METHODS: { value: PlayerPaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "CASH", label: "Efectivo", icon: Banknote },
  { value: "QR", label: "QR", icon: QrCode },
  { value: "TRANSFER", label: "Transferencia", icon: Landmark },
];

/**
 * "Venta suelta": someone buys a drink without playing. Pick what they take, tap how they paid
 * — that's the whole flow. It lands in the day's cash and takes the units out of stock.
 */
export function CounterSaleDialog({
  products,
  open,
  onOpenChange,
}: {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [lines, setLines] = useState<{ productId: string; quantity: number }[]>([]);
  const [picker, setPicker] = useState("");
  const [payingWith, setPayingWith] = useState<PlayerPaymentMethod | null>(null);
  const createSale = useCreateCounterSale();

  const byId = new Map(products.map((p) => [p.id, p]));
  const byCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    acc[p.category] = [...(acc[p.category] ?? []), p];
    return acc;
  }, {});
  const totalCents = lines.reduce(
    (sum, line) => sum + (byId.get(line.productId)?.priceCents ?? 0) * line.quantity,
    0,
  );

  function close(next: boolean) {
    if (!next) {
      setLines([]);
      setPicker("");
    }
    onOpenChange(next);
  }

  function add(productId: string) {
    setLines((prev) =>
      prev.some((l) => l.productId === productId)
        ? prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l))
        : [...prev, { productId, quantity: 1 }],
    );
    setPicker("");
  }

  function setQuantity(productId: string, quantity: number) {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }

  function charge(method: PlayerPaymentMethod) {
    if (lines.length === 0) return;
    setPayingWith(method);
    createSale.mutate(
      { items: lines, method },
      { onSuccess: () => close(false), onSettled: () => setPayingWith(null) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Venta suelta
          </DialogTitle>
          <DialogDescription>
            Alguien compra sin jugar: cargá lo que se lleva y tocá cómo pagó.
          </DialogDescription>
        </DialogHeader>

        <Select value={picker} onValueChange={(value) => value && add(value)}>
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                products.length === 0
                  ? "No hay productos activos en el catálogo"
                  : "＋ Agregar producto"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => (
              <SelectGroup key={cat}>
                <SelectLabel>{CATEGORY_LABELS[cat]}</SelectLabel>
                {byCategory[cat].map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} · {formatPrice(product.priceCents)}
                    {product.stockQuantity !== null && product.stockQuantity <= 0 && " · sin stock"}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {lines.length === 0 ? (
          <p className="text-muted-foreground py-3 text-center text-sm">
            Todavía no cargaste nada.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {lines.map((line) => {
              const product = byId.get(line.productId);
              const warning = stockWarning(product, line.quantity);
              return (
                <div key={line.productId} className="flex flex-col gap-1 rounded-lg border px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-medium">
                      {product?.name ?? "Producto"}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        aria-label="Uno menos"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      >
                        {line.quantity === 1 ? <Trash2 className="size-3" /> : <Minus className="size-3" />}
                      </Button>
                      <span className="w-6 text-center text-sm font-medium tabular-nums">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        aria-label="Uno más"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                      <span className="w-20 text-right text-sm font-semibold tabular-nums">
                        {formatPrice((product?.priceCents ?? 0) * line.quantity)}
                      </span>
                    </div>
                  </div>
                  {warning && (
                    <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="size-3" />
                      {warning}
                    </p>
                  )}
                </div>
              );
            })}
            <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Total a cobrar</span>
              <span className="text-base font-semibold tabular-nums">{formatPrice(totalCents)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {METHODS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="outline"
              className={cn("h-10", payingWith === value && "ring-brand/40 ring-2")}
              disabled={lines.length === 0 || createSale.isPending}
              onClick={() => charge(value)}
            >
              {payingWith === value ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )}
              {label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
