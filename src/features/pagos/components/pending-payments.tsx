"use client";

import { Check, Clock, Loader2, Wallet, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDay, formatPrice, formatPriceExact, formatTime } from "@/lib/format";
import {
  useBookings,
  useConfirmPayment,
  useRejectPayment,
} from "@/features/reservas/hooks/use-bookings";
import type { Booking } from "@/types/api/bookings";

/** Soonest-to-expire first; bookings without an expiry go last. */
function byExpiry(a: Booking, b: Booking): number {
  const ta = a.paymentExpiresAt ? new Date(a.paymentExpiresAt).getTime() : Infinity;
  const tb = b.paymentExpiresAt ? new Date(b.paymentExpiresAt).getTime() : Infinity;
  return ta - tb;
}

function PendingRow({
  booking,
  busyId,
  onConfirm,
  onReject,
}: {
  booking: Booking;
  busyId: string | undefined;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const amount =
    booking.transferAmountCents != null
      ? formatPriceExact(booking.transferAmountCents)
      : formatPrice(booking.depositCents);
  const busy = busyId === booking.id;
  const anyBusy = busyId !== undefined;

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium">{booking.playerName}</p>
        <p className="text-muted-foreground text-sm">
          {booking.slot.court.name} · {formatDay(booking.slot.startsAt)} ·{" "}
          {formatTime(booking.slot.startsAt)}
        </p>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {booking.paymentExpiresAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              vence {formatTime(booking.paymentExpiresAt)}
            </span>
          )}
          {booking.playerPhone && (
            <a
              href={`https://wa.me/${booking.playerPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              {booking.playerPhone}
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right">
          <p className="text-muted-foreground text-xs">Importe exacto</p>
          <p className="font-semibold tabular-nums">{amount}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => onConfirm(booking.id)}
            disabled={anyBusy}
            className="bg-emerald-600 text-white hover:bg-emerald-600/90"
          >
            {busy ? <Loader2 className="animate-spin" /> : <Check />}
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onReject(booking.id)}
            disabled={anyBusy}
            aria-label={`Rechazar pago de ${booking.playerName}`}
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PendingPayments() {
  const { data, isLoading } = useBookings({ status: "PENDING_PAYMENT" });
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();

  const pending = (data ?? []).slice().sort(byExpiry);

  // Inbox pattern: stay out of the way until there's something to act on.
  if (isLoading || pending.length === 0) return null;

  const busyId = confirmPayment.isPending
    ? confirmPayment.variables
    : rejectPayment.isPending
      ? rejectPayment.variables
      : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="text-brand size-5" />
          Pagos por confirmar
          <Badge variant="secondary" className="ml-1">
            {pending.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y border-t">
          {pending.map((booking) => (
            <PendingRow
              key={booking.id}
              booking={booking}
              busyId={busyId}
              onConfirm={(id) => confirmPayment.mutate(id)}
              onReject={(id) => rejectPayment.mutate(id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
