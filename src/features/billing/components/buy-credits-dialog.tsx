"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { formatPrice } from "@/lib/format";
import { formatCount } from "@/features/plan/lib/format";
import { useBuyCreditPack } from "@/features/billing/hooks/use-billing";
import type { CreditPackOffer } from "@/types/api/billing";

/**
 * "Comprar más créditos": the three packs as cards, the popular one picked by default, and the
 * conditions in one line. Buying sends the owner to MercadoPago; they come back to Facturación.
 */
export function BuyCreditsDialog({
  open,
  onOpenChange,
  catalog,
  validityMonths,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: CreditPackOffer[];
  validityMonths: number;
}) {
  const [selected, setSelected] = useState(
    () => catalog.find((pack) => pack.popular)?.key ?? catalog[0]?.key ?? "",
  );
  const buy = useBuyCreditPack();
  // Stays busy until the browser leaves for MercadoPago, so nobody taps twice.
  const busy = buy.isPending || buy.isSuccess;

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Comprar más créditos</DialogTitle>
          <DialogDescription>Elegí un paquete. Lo pagás con MercadoPago.</DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="Paquetes de créditos" className="grid gap-2 sm:grid-cols-3">
          {catalog.map((pack) => {
            const checked = pack.key === selected;
            return (
              <button
                key={pack.key}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setSelected(pack.key)}
                disabled={busy}
                className={cn(
                  "relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                  checked
                    ? "border-brand/60 bg-brand/[0.07] ring-brand/30 ring-1"
                    : "border-border/70 hover:border-border hover:bg-foreground/[0.02]",
                )}
              >
                {pack.popular && (
                  <span className="bg-brand absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
                    Más popular
                  </span>
                )}
                <span className="text-2xl font-semibold tabular-nums">
                  {formatCount(pack.credits)}
                </span>
                <span className="text-muted-foreground text-xs">créditos</span>
                <span className="mt-1 text-sm font-medium tabular-nums">
                  {formatPrice(pack.priceCents)}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-muted-foreground text-xs text-pretty">
          Se suman al instante, se usan después de los créditos de tu plan y vencen a los{" "}
          {validityMonths} meses. Necesitás tener el plan activo.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={() => buy.mutate(selected)} disabled={busy || !selected}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Abriendo MercadoPago…
              </>
            ) : (
              "Comprar créditos"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
