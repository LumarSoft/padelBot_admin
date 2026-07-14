"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Maximize2, MessagesSquare, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDay, formatTime } from "@/lib/format";
import type { Booking } from "@/types/api/bookings";

/** A labeled detail cell used in the receipt dialog's info strip. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}

/**
 * Shows the transfer-receipt photo full-size in a dialog, with the booking details and the
 * Confirmar / Rechazar actions in one place, so an admin can verify and act without leaving
 * the screen. The thumbnail itself is the trigger. The image is loaded through the same-origin
 * BFF route (auth-scoped); the raw storage URL never reaches the browser.
 */
export function ReceiptViewer({
  booking,
  amount,
  busy,
  anyBusy,
  onConfirm,
  onReject,
}: {
  booking: Booking;
  amount: string;
  busy: boolean;
  anyBusy: boolean;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const src = `/api/bookings/${booking.id}/receipt`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver comprobante de ${booking.playerName}`}
        className="group focus-visible:ring-ring relative size-16 shrink-0 overflow-hidden rounded-lg border ring-emerald-500/30 transition hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="size-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
          <Maximize2 className="size-4" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Verificar comprobante</DialogTitle>
            <DialogDescription>
              Revisá que la transferencia coincida y confirmá o rechazá la reserva.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/40 grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-4">
            <Detail label="Jugador" value={booking.playerName} />
            <Detail label="Cancha" value={booking.slot.court.name} />
            <Detail
              label="Turno"
              value={`${formatDay(booking.slot.startsAt)} · ${formatTime(booking.slot.startsAt)}`}
            />
            <Detail label="Importe" value={amount} />
          </div>

          <div className="flex max-h-[55vh] justify-center overflow-auto rounded-lg border bg-black/5 p-2 dark:bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Comprobante de ${booking.playerName}`}
              className="h-auto w-auto rounded"
            />
          </div>

          {booking.playerPhone && (
            <Link
              href={`/panel/conversaciones?waId=${booking.playerPhone}`}
              className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 text-center text-xs underline underline-offset-2"
            >
              <MessagesSquare className="size-3.5" />
              Responder por la bandeja del chat
            </Link>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onReject(booking.id);
                setOpen(false);
              }}
              disabled={anyBusy}
              className="text-destructive hover:border-destructive/40 hover:text-destructive"
            >
              <X />
              Rechazar
            </Button>
            <Button
              variant="success"
              onClick={() => {
                onConfirm(booking.id);
                setOpen(false);
              }}
              disabled={anyBusy}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Check />}
              Confirmar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
