"use client";

import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, ShoppingBasket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatHourRange, formatPrice, formatPriceExact } from "@/lib/format";
import { formatDniFromCuit } from "@/lib/identity";
import { dayRange, shiftDay, todayKey } from "@/features/agenda/lib/schedule";
import { useBookings } from "@/features/reservas/hooks/use-bookings";
import { AddProductsDialog } from "@/features/productos/components/add-products-dialog";
import type { Booking } from "@/types/api/bookings";

/** Earliest slot first. */
function byTime(a: Booking, b: Booking): number {
  return new Date(a.slot.startsAt).getTime() - new Date(b.slot.startsAt).getTime();
}

function paidAmount(booking: Booking): string {
  return booking.transferAmountCents != null
    ? formatPriceExact(booking.transferAmountCents)
    : formatPrice(booking.depositCents);
}

function ConfirmedBookingRow({ booking }: { booking: Booking }) {
  const [consumosOpen, setConsumosOpen] = useState(false);
  const consumosTotal = booking.bookingProducts.reduce(
    (sum, p) => sum + p.unitPriceCents * p.quantity,
    0,
  );
  const totalItems = booking.bookingProducts.reduce((s, p) => s + p.quantity, 0);

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{booking.playerName}</p>
          <p className="text-muted-foreground text-sm">
            {booking.slot.court.name} ·{" "}
            {formatHourRange(booking.slot.startsAt, booking.slot.endsAt)} hs
          </p>
          {(booking.payerCuit || booking.payerEmail) && (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              Pagó:{" "}
              {formatDniFromCuit(booking.payerCuit) &&
                `DNI ${formatDniFromCuit(booking.payerCuit)}`}
              {formatDniFromCuit(booking.payerCuit) && booking.payerEmail && " · "}
              {booking.payerEmail}
            </p>
          )}
          {booking.bookingProducts.length > 0 && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              Consumos: {booking.bookingProducts.map((p) => `${p.product.name} x${p.quantity}`).join(", ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="font-semibold tabular-nums">{paidAmount(booking)}</p>
          {consumosTotal > 0 && (
            <p className="text-muted-foreground text-xs tabular-nums">
              + {formatPrice(consumosTotal)} consumos
            </p>
          )}
          <button
            type="button"
            onClick={() => setConsumosOpen(true)}
            className="text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-1 text-xs underline underline-offset-2 transition-colors"
            title="Ver o dividir la cuenta del turno"
          >
            <ShoppingBasket className="size-3" />
            {totalItems > 0
              ? `Dividir cuenta (${totalItems} ítem${totalItems !== 1 ? "s" : ""})`
              : "Dividir cuenta"}
          </button>
        </div>
      </div>
      <AddProductsDialog
        bookingId={booking.id}
        playerName={booking.playerName}
        courtPriceCents={booking.slot.priceCents}
        currentProducts={booking.bookingProducts}
        open={consumosOpen}
        onOpenChange={setConsumosOpen}
      />
    </>
  );
}

export function ConfirmedPayments() {
  const [day, setDay] = useState(todayKey());
  const range = dayRange(day);
  const { data, isLoading } = useBookings({
    status: "CONFIRMED",
    from: range.from,
    to: range.to,
  });

  // Only confirmed bookings that carried a real payment (seña / full), not
  // admin-created bookings (which have no deposit).
  const payments = (data ?? []).filter((b) => b.depositCents > 0).sort(byTime);
  const totalDeposits = payments.reduce(
    (sum, b) => sum + (b.transferAmountCents ?? b.depositCents),
    0,
  );
  const totalConsumos = payments.reduce(
    (sum, b) =>
      sum + b.bookingProducts.reduce((s, p) => s + p.unitPriceCents * p.quantity, 0),
    0,
  );
  const total = totalDeposits + totalConsumos;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            Pagos concretados
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Día anterior"
              onClick={() => setDay((d) => shiftDay(d, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value || todayKey())}
              className="w-40"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Día siguiente"
              onClick={() => setDay((d) => shiftDay(d, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 px-4 py-6 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Cargando pagos…
          </div>
        ) : payments.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-sm">
            No hay pagos concretados para este día.
          </p>
        ) : (
          <>
            <div className="divide-y border-t">
              {payments.map((booking) => (
                <ConfirmedBookingRow key={booking.id} booking={booking} />
              ))}
            </div>
            <div className="border-t px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {payments.length} {payments.length === 1 ? "pago" : "pagos"}
                </span>
                <span className="font-semibold tabular-nums">{formatPrice(total)}</span>
              </div>
              {totalConsumos > 0 && (
                <div className="text-muted-foreground mt-0.5 flex items-center justify-between text-xs">
                  <span>
                    Señas: {formatPrice(totalDeposits)} · Consumos: {formatPrice(totalConsumos)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
