"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRegisterCount } from "@/features/kiosco/hooks/use-stock";
import {
  ProductQuantityList,
  parseQuantity,
  type QuantityListProduct,
} from "@/features/kiosco/components/product-quantity-list";
import type { CountResult } from "@/types/api/stock";

function describe(result: CountResult): { text: string; tone: "ok" | "short" | "over" | "new" } {
  if (result.difference === null) {
    return { text: `empieza el control con ${result.countedQuantity}`, tone: "new" };
  }
  if (result.difference === 0) return { text: "da justo", tone: "ok" };
  const units = Math.abs(result.difference);
  return result.difference < 0
    ? { text: `faltan ${units}`, tone: "short" }
    : { text: `sobran ${units}`, tone: "over" };
}

/**
 * "Contar stock": a blank sheet (the expected number is NOT shown, so nobody copies it) with one
 * input per product. Empty inputs aren't counted. After saving it shows what didn't match.
 */
export function CountDialog({
  products,
  open,
  onOpenChange,
}: {
  products: QuantityListProduct[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<CountResult[] | null>(null);
  const registerCount = useRegisterCount();

  const items = products.flatMap((p) => {
    const counted = parseQuantity(values[p.id]);
    return counted === null ? [] : [{ productId: p.id, countedQuantity: counted }];
  });

  function close(next: boolean) {
    if (!next) {
      setValues({});
      setResults(null);
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    if (items.length === 0) return;
    registerCount.mutate({ items }, { onSuccess: (data) => setResults(data) });
  }

  const mismatches = (results ?? []).filter((r) => r.difference !== 0);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            Contar stock
          </DialogTitle>
          <DialogDescription>
            {results
              ? "Listo, el stock quedó con lo que contaste."
              : "Contá lo que hay en la heladera y el depósito y anotá la cantidad real. Lo que dejes vacío no se cuenta."}
          </DialogDescription>
        </DialogHeader>

        {results ? (
          mismatches.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              Todo coincide: {results.length}{" "}
              {results.length === 1 ? "producto contado" : "productos contados"}.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {mismatches.map((result) => {
                const { text, tone } = describe(result);
                return (
                  <div
                    key={result.productId}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">{result.name}</span>
                    <span
                      className={cn(
                        "shrink-0 font-medium tabular-nums",
                        tone === "short" && "text-destructive",
                        tone === "over" && "text-amber-600 dark:text-amber-400",
                        tone === "new" && "text-muted-foreground",
                      )}
                    >
                      {text}
                    </span>
                  </div>
                );
              })}
              {results.length > mismatches.length && (
                <p className="text-muted-foreground px-1 pt-1 text-xs">
                  El resto ({results.length - mismatches.length}) dio justo.
                </p>
              )}
            </div>
          )
        ) : (
          <ProductQuantityList
            products={products}
            values={values}
            onChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))}
            disabled={registerCount.isPending}
            placeholder="—"
          />
        )}

        <DialogFooter>
          {results ? (
            <Button onClick={() => close(false)}>Listo</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => close(false)}
                disabled={registerCount.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={registerCount.isPending || items.length === 0}
              >
                {registerCount.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  `Guardar conteo${items.length > 0 ? ` (${items.length})` : ""}`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
