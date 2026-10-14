"use client";

import { Loader2, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { todayKey } from "@/features/agenda/lib/schedule";
import {
  useCounterSales,
  useRemoveCounterSale,
} from "@/features/kiosco/hooks/use-stock";
import type { CounterSale } from "@/types/api/stock";
import type { PlayerPaymentMethod } from "@/types/api/bookings";

const hourFormat = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const METHOD_LABELS: Record<PlayerPaymentMethod, string> = {
  CASH: "Efectivo",
  QR: "QR",
  TRANSFER: "Transferencia",
};

/** Today's counter sales with what each payment method adds up to, and undo for mistakes. */
export function CounterSalesToday() {
  const { data, isLoading } = useCounterSales(todayKey());
  const removeSale = useRemoveCounterSale();
  const confirm = useConfirm();

  async function handleUndo(sale: CounterSale) {
    const ok = await confirm({
      title: `¿Anular la venta de ${sale.product.name}?`,
      description: "Sale de la caja de hoy y la mercadería vuelve al stock.",
      confirmLabel: "Anular venta",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) removeSale.mutate(sale.id);
  }

  if (isLoading || !data) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando ventas…
      </div>
    );
  }

  if (data.sales.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Sin ventas sueltas hoy"
        description="Las bebidas o pelotas que se venden sin turno se cargan con «Venta suelta» y suman a la caja del día."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold tabular-nums">
          Total {formatPrice(data.totalCents)}
        </span>
        {(Object.keys(METHOD_LABELS) as PlayerPaymentMethod[])
          .filter((method) => data.byMethod[method] > 0)
          .map((method) => (
            <span key={method} className="text-muted-foreground tabular-nums">
              {METHOD_LABELS[method]} {formatPrice(data.byMethod[method])}
            </span>
          ))}
      </div>
      <div className="divide-y rounded-xl border">
        {data.sales.map((sale) => (
          <div key={sale.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground w-12 shrink-0 tabular-nums">
              {hourFormat.format(new Date(sale.createdAt))}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {sale.quantity > 1 && `${sale.quantity} × `}
              {sale.product.name}
              {sale.user && (
                <span className="text-muted-foreground"> · {sale.user.name}</span>
              )}
            </span>
            <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
              {METHOD_LABELS[sale.method]}
            </span>
            <span className="w-20 shrink-0 text-right font-medium tabular-nums">
              {formatPrice(sale.quantity * sale.unitPriceCents)}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Anular venta de ${sale.product.name}`}
              className="text-muted-foreground hover:text-destructive"
              disabled={removeSale.isPending}
              onClick={() => void handleUndo(sale)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
