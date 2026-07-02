"use client";

import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatHourRange, formatPrice, formatPriceExact } from "@/lib/format";
import { formatDniFromCuit } from "@/lib/identity";
import { dayRange, shiftDay, todayKey } from "@/features/agenda/lib/schedule";
import { useBookings } from "@/features/reservas/hooks/use-bookings";
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
  const total = payments.reduce(
    (sum, b) => sum + (b.transferAmountCents ?? b.depositCents),
    0,
  );

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
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
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
                  </div>
                  <p className="font-semibold tabular-nums">{paidAmount(booking)}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {payments.length} {payments.length === 1 ? "pago" : "pagos"}
              </span>
              <span className="font-semibold tabular-nums">{formatPrice(total)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
