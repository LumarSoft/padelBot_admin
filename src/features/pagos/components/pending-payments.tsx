"use client";

import Link from "next/link";
import {
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Hourglass,
  IdCard,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessagesSquare,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDay, formatHourRange, formatPrice, formatPriceExact } from "@/lib/format";
import {
  useBookings,
  useConfirmPayment,
  useRejectPayment,
} from "@/features/reservas/hooks/use-bookings";
import { useTransferConfig } from "@/features/configuracion/hooks/use-transfer-config";
import { ReceiptViewer } from "@/features/pagos/components/receipt-viewer";
import { useSoundStore } from "@/features/realtime/stores/sound-store";
import { playCashSound, primeAudio } from "@/features/realtime/lib/play-cash-sound";
import type { Booking } from "@/types/api/bookings";

/** Short relative time, e.g. "recién", "hace 4 min", "hace 2 h". */
function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.floor(mins / 60);
  return `hace ${h} h`;
}

/** Receipts to review float to the top; then soonest-to-expire first. */
function byPriority(a: Booking, b: Booking): number {
  if (a.hasReceipt !== b.hasReceipt) return a.hasReceipt ? -1 : 1;
  const ta = a.paymentExpiresAt ? new Date(a.paymentExpiresAt).getTime() : Infinity;
  const tb = b.paymentExpiresAt ? new Date(b.paymentExpiresAt).getTime() : Infinity;
  return ta - tb;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** One labeled detail (icon + label + value) used in the card's info grid. */
function Field({
  icon: Icon,
  label,
  value,
  emphasis = false,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {label}
        </p>
        <p className={cn("truncate text-sm", emphasis ? "font-semibold" : "font-medium")}>
          {value}
        </p>
      </div>
    </div>
  );
}

function PaymentCard({
  booking,
  receiptMode,
  amountLabel,
  busyId,
  onConfirm,
  onReject,
}: {
  booking: Booking;
  receiptMode: boolean;
  amountLabel: string;
  busyId: string | undefined;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const amount =
    booking.transferAmountCents != null
      ? receiptMode
        ? formatPrice(booking.transferAmountCents)
        : formatPriceExact(booking.transferAmountCents)
      : formatPrice(booking.depositCents);
  const busy = busyId === booking.id;
  const anyBusy = busyId !== undefined;
  const needsReview = booking.hasReceipt;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-shadow hover:shadow-sm",
        needsReview ? "border-emerald-500/40 bg-emerald-500/[0.03]" : "bg-card",
      )}
    >
      <div className="flex gap-4 p-4">
        {/* Receipt thumbnail (RECEIPT) or initials avatar */}
        {needsReview ? (
          <ReceiptViewer
            booking={booking}
            amount={amount}
            busy={busy}
            anyBusy={anyBusy}
            onConfirm={onConfirm}
            onReject={onReject}
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-16 shrink-0 items-center justify-center rounded-lg text-base font-semibold">
            {initials(booking.playerName)}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Header: name + status, amount */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold">{booking.playerName}</h3>
                {needsReview ? (
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <ImageIcon className="size-3" />
                    Comprobante
                  </Badge>
                ) : receiptMode ? (
                  <Badge variant="secondary" className="text-muted-foreground">
                    <Hourglass className="size-3" />
                    Esperando comprobante
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {needsReview && booking.receiptUploadedAt
                  ? `Comprobante recibido ${timeAgo(booking.receiptUploadedAt)}`
                  : booking.paymentExpiresAt
                    ? `Reserva tomada ${timeAgo(booking.createdAt)}`
                    : null}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                {amountLabel}
              </p>
              <p className="text-xl font-bold tabular-nums">{amount}</p>
            </div>
          </div>

          {/* Info grid: court / date / time range — the key details, clearly labeled */}
          <div className="bg-muted/40 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-3 sm:grid-cols-3">
            <Field icon={MapPin} label="Cancha" value={booking.slot.court.name} />
            <Field icon={CalendarDays} label="Fecha" value={formatDay(booking.slot.startsAt)} />
            <Field
              icon={Clock}
              label="Horario"
              value={`${formatHourRange(booking.slot.startsAt, booking.slot.endsAt)} hs`}
              emphasis
            />
          </div>

          {/* Footer: contact + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {booking.playerPhone && (
                <Link
                  href={`/panel/conversaciones?waId=${booking.playerPhone}`}
                  className="hover:text-foreground inline-flex items-center gap-1.5 underline underline-offset-2"
                  title="Abrir el chat en la bandeja"
                >
                  <MessagesSquare className="size-3.5" />
                  Responder por chat
                </Link>
              )}
              {booking.playerDni && (
                <span className="inline-flex items-center gap-1.5">
                  <IdCard className="size-3.5" />
                  DNI {booking.playerDni}
                </span>
              )}
              {booking.payerCuit && (
                <span className="inline-flex items-center gap-1.5">
                  <CreditCard className="size-3.5" />
                  Pagó CUIT {booking.payerCuit}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(booking.id)}
                disabled={anyBusy}
                className="text-destructive hover:border-destructive/40 hover:text-destructive"
              >
                <X />
                Rechazar
              </Button>
              <Button
                size="sm"
                onClick={() => onConfirm(booking.id)}
                disabled={anyBusy}
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
              >
                {busy ? <Loader2 className="animate-spin" /> : <Check />}
                Confirmar reserva
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Toggles the cash-alert sound; clicking to enable also plays a preview. */
function SoundToggle() {
  const muted = useSoundStore((s) => s.muted);
  const toggle = useSoundStore((s) => s.toggleMuted);

  function handleClick() {
    const wasMuted = muted;
    toggle();
    if (wasMuted) {
      primeAudio();
      playCashSound();
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      aria-label={muted ? "Activar y probar el sonido de pagos" : "Silenciar sonido de pagos"}
      title={muted ? "Sonido silenciado — tocá para activar y probar" : "Sonido activo — tocá para silenciar"}
      className="text-muted-foreground"
    >
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </Button>
  );
}

export function PendingPayments({ alwaysShow = false }: { alwaysShow?: boolean } = {}) {
  const { data, isLoading } = useBookings({ status: "PENDING_PAYMENT" });
  const { data: config } = useTransferConfig();
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();

  const receiptMode = config?.paymentVerificationMode === "RECEIPT";
  const amountLabel = config?.depositMode === "FULL" ? "Total a confirmar" : "Seña a confirmar";
  const pending = (data ?? []).slice().sort(byPriority);
  const toReview = pending.filter((b) => b.hasReceipt).length;

  if (isLoading && !alwaysShow) return null;
  // Inbox pattern: on the overview, stay out of the way until there's something to act on.
  if (pending.length === 0 && !alwaysShow) return null;

  if (pending.length === 0) {
    return (
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Wallet className="text-brand size-5" />
          <CardTitle>Pagos por confirmar</CardTitle>
          <div className="ml-auto">
            <SoundToggle />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Cargando…" : "No hay pagos pendientes. ¡Todo al día! 🎾"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const busyId = confirmPayment.isPending
    ? confirmPayment.variables
    : rejectPayment.isPending
      ? rejectPayment.variables
      : undefined;

  return (
    <Card className={cn(toReview > 0 && "ring-1 ring-emerald-500/30")}>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center gap-2">
          <Wallet className="text-brand size-5" />
          <CardTitle>Pagos por confirmar</CardTitle>
          <Badge variant="secondary">{pending.length}</Badge>
          {toReview > 0 && (
            <Badge className="animate-pulse border-transparent bg-emerald-600 text-white">
              {toReview} por revisar
            </Badge>
          )}
          <div className="ml-auto">
            <SoundToggle />
          </div>
        </div>
        {receiptMode && (
          <p className="text-muted-foreground text-xs">
            Tocá el comprobante para verlo en grande, verificá la transferencia y confirmá o rechazá.
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4">
        {pending.map((booking) => (
          <PaymentCard
            key={booking.id}
            booking={booking}
            receiptMode={receiptMode}
            amountLabel={amountLabel}
            busyId={busyId}
            onConfirm={(id) => confirmPayment.mutate(id)}
            onReject={(id) => rejectPayment.mutate(id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
