"use client";

import { useState } from "react";
import { History, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductMovements } from "@/features/kiosco/hooks/use-stock";
import { StockLevel } from "@/features/kiosco/components/stock-level";
import type { StockMovement } from "@/types/api/stock";

const whenFormat = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const hourFormat = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function describe(movement: StockMovement): string {
  if (movement.type === "PURCHASE") {
    return movement.note ? `Entró mercadería · ${movement.note}` : "Entró mercadería";
  }
  if (movement.type === "SALE" && movement.booking) {
    const { playerName, slot } = movement.booking;
    const verb = movement.quantity > 0 ? "Quitado del turno" : "Turno";
    return `${verb} de ${playerName} · ${slot.court.name} ${hourFormat.format(new Date(slot.startsAt))}`;
  }
  return movement.note ?? (movement.type === "SALE" ? "Venta" : "Ajuste");
}

/** A product's "entra / sale / queda", newest first — what the owner reads to find a faltante. */
export function MovementsDialog({
  productId,
  onOpenChange,
}: {
  productId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  // Keep showing the last product while the dialog animates closed.
  const [shownId, setShownId] = useState(productId);
  if (productId !== null && productId !== shownId) setShownId(productId);
  const { data, isLoading } = useProductMovements(shownId);

  return (
    <Dialog open={productId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5" />
            {data?.product.name ?? "Historial"}
          </DialogTitle>
          <DialogDescription>
            {data ? (
              <span className="flex items-center gap-2">
                Ahora:
                <StockLevel
                  stockQuantity={data.product.stockQuantity}
                  lowStockThreshold={data.product.lowStockThreshold}
                />
                {data.product.lowStockThreshold !== null &&
                  ` · mínimo ${data.product.lowStockThreshold}`}
              </span>
            ) : (
              "Lo que entró, lo que salió y lo que quedó."
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Cargando historial…
          </div>
        ) : data.movements.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Todavía no hay movimientos. Se empieza a llevar con un conteo o
            cuando entra mercadería.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuándo</TableHead>
                  <TableHead>Movimiento</TableHead>
                  <TableHead className="text-right">Entra</TableHead>
                  <TableHead className="text-right">Sale</TableHead>
                  <TableHead className="text-right">Queda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {whenFormat.format(new Date(movement.createdAt))}
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="max-w-[18rem] truncate">{describe(movement)}</p>
                      {movement.user && (
                        <p className="text-muted-foreground text-xs">
                          {movement.user.name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
                      {movement.quantity > 0 ? `+${movement.quantity}` : ""}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {movement.quantity < 0 ? movement.quantity : ""}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {movement.stockAfter}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
