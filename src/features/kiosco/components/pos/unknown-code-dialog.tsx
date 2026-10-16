"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link2, Loader2, PackagePlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import { productsService } from "@/services/products.service";
import { matchByName } from "@/features/kiosco/lib/pos";
import type { PosMode } from "@/stores/pos-store";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Product,
  type ProductCategory,
} from "@/types/api/products";

type Choice = "existing" | "new";

function useSaveCode() {
  const queryClient = useQueryClient();
  return useMutation<
    Product,
    ApiError,
    | { kind: "assign"; productId: string; barcode: string }
    | { kind: "create"; name: string; priceCents: number; category: ProductCategory; barcode: string }
  >({
    mutationFn: (input) =>
      input.kind === "assign"
        ? productsService.update(input.productId, { barcode: input.barcode })
        : productsService.create({
            name: input.name,
            priceCents: input.priceCents,
            category: input.category,
            barcode: input.barcode,
          }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      // A new product counts in the setup wizard's kiosco step.
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
    },
    onError: (error) => toast.error(error.message),
  });
}

function UnknownCodeForm({
  code,
  mode,
  products,
  onResolved,
  onCancel,
}: {
  code: string;
  mode: PosMode;
  products: Product[];
  onResolved: (product: Product) => void;
  onCancel: () => void;
}) {
  // Products still without a code: on the first days with the scanner, most unknown codes are
  // bottles that are already in the catalog.
  const candidates = products.filter((p) => p.isActive && p.barcode === null);
  const [choice, setChoice] = useState<Choice>(candidates.length > 0 ? "existing" : "new");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>("BEBIDA");
  const save = useSaveCode();

  const listed = search.trim() ? matchByName(candidates, search) : candidates;
  const priceNumber = Number(price);
  const priceValid = price.trim() !== "" && Number.isFinite(priceNumber) && priceNumber >= 0;
  const canCreate = name.trim() !== "" && priceValid && !save.isPending;

  function assign(product: Product) {
    save.mutate(
      { kind: "assign", productId: product.id, barcode: code },
      { onSuccess: onResolved },
    );
  }

  function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canCreate) return;
    save.mutate(
      {
        kind: "create",
        name: name.trim(),
        priceCents: Math.round(priceNumber * 100),
        category,
        barcode: code,
      },
      { onSuccess: onResolved },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Este código no está cargado</DialogTitle>
        <DialogDescription>
          Código <span className="text-foreground font-mono font-medium">{code}</span>. Decinos
          qué producto es y queda guardado: la próxima vez se reconoce solo.
        </DialogDescription>
      </DialogHeader>

      {candidates.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "existing", label: "Ya está en la lista", icon: Link2 },
              { value: "new", label: "Es un producto nuevo", icon: PackagePlus },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={choice === value}
              onClick={() => setChoice(value)}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
                choice === value
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:border-foreground/40",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {choice === "existing" ? (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscá el producto por nombre"
              aria-label="Buscar producto"
              autoFocus
              className="h-9 pl-8"
            />
          </div>
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {listed.length === 0 ? (
              <li className="text-muted-foreground px-2 py-4 text-center text-sm">
                No hay productos sin código con ese nombre.{" "}
                <button
                  type="button"
                  className="text-foreground font-medium underline-offset-2 hover:underline"
                  onClick={() => {
                    setName(search.trim());
                    setChoice("new");
                  }}
                >
                  Crearlo
                </button>
              </li>
            ) : (
              listed.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={save.isPending}
                    onClick={() => assign(product)}
                    className="hover:bg-muted/60 flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-50"
                  >
                    <span className="min-w-0 truncate font-medium">{product.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {formatPrice(product.priceCents)} · {CATEGORY_LABELS[product.category]}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={onCancel} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" /> : null}
              Cancelar
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <form onSubmit={create} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pos-new-name">Nombre</Label>
            <Input
              id="pos-new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
              placeholder="Ej: Gatorade 500 ml"
              disabled={save.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pos-new-price">Precio de venta (ARS)</Label>
            <Input
              id="pos-new-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 2500"
              disabled={save.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Categoría</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ORDER.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={save.isPending}
                  aria-pressed={category === cat}
                  className={cn(
                    "rounded-md border px-3 py-1 text-sm transition-colors",
                    category === cat
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={save.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canCreate}>
              {save.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Guardando…
                </>
              ) : mode === "cobrar" ? (
                "Crear y sumar a la venta"
              ) : (
                "Crear y sumar a la entrada"
              )}
            </Button>
          </DialogFooter>
        </form>
      )}
    </>
  );
}

/**
 * A scan nobody in the catalog has: say which product it is (one already in the list, the
 * usual case on the first days with the scanner) or create it with that code. Either way the
 * code is saved on the product and the scan goes on to the ticket or the delivery.
 */
export function UnknownCodeDialog({
  code,
  mode,
  products,
  onResolved,
  onClose,
}: {
  /** The unknown code; null = closed. */
  code: string | null;
  mode: PosMode;
  products: Product[];
  onResolved: (product: Product) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={code !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {code !== null && (
          <UnknownCodeForm
            key={code}
            code={code}
            mode={mode}
            products={products}
            onResolved={onResolved}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
