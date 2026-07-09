"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  Check,
  Copy,
  FileCheck2,
  Hourglass,
  IdCard,
  Lock,
  RotateCcw,
  ShoppingBasket,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { AddProductsDialog } from "@/features/productos/components/add-products-dialog";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, formatPriceExact, formatTimeRange } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/api-error";
import { slotsService } from "@/services/slots.service";
import { buildSlotDateTimes, type ScheduleBand } from "@/features/agenda/lib/schedule";
import {
  useCreateBooking,
  useCancelBooking,
  useConfirmPayment,
  useRejectPayment,
} from "@/features/reservas/hooks/use-bookings";
import { useCreateSlot, useUpdateSlot, useDeleteSlot } from "@/features/turnos/hooks/use-slots";
import { useTransferConfig } from "@/features/configuracion/hooks/use-transfer-config";
import type { Slot } from "@/types/api/turnos";
import type { Booking } from "@/types/api/bookings";

// ── Shared bits ───────────────────────────────────────────────────────────────

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/** Minutes-granular countdown for a pending payment window. */
function timeLeft(iso: string | null): { label: string; expired: boolean } | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { label: "Venció", expired: true };
  const mins = Math.ceil(diff / 60_000);
  if (mins < 60) return { label: `Vence en ${mins} min`, expired: false };
  return { label: `Vence en ${Math.ceil(mins / 60)} h`, expired: false };
}

/** Card header: a colored avatar/icon disc + title + subtitle. Gives each popover a clear identity. */
function CardHeader({
  disc,
  tone,
  title,
  subtitle,
  badge,
}: {
  disc: React.ReactNode;
  tone: "brand" | "amber" | "muted" | "emerald";
  title: string;
  subtitle: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const toneClass = {
    brand: "bg-brand/15 text-brand",
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    muted: "bg-muted text-muted-foreground",
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  }[tone];

  return (
    <header className="flex items-start gap-2.5">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          toneClass,
        )}
      >
        {disc}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-heading truncate text-sm font-semibold">{title}</p>
          {badge}
        </div>
        <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
      </div>
    </header>
  );
}

/** Small "copy to clipboard" button with a transient check state. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar");
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-xs"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copiado" : label}
    </Button>
  );
}

function WhatsAppLink({ phone }: { phone: string }) {
  return (
    <a
      href={waLink(phone)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
    >
      <WhatsAppIcon className="size-3.5" />
      WhatsApp
    </a>
  );
}

function RoleBadge({ booking, isBot }: { booking: Booking; isBot: boolean }) {
  if (booking.recurringBookingId) {
    return (
      <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-medium">Fijo</span>
    );
  }
  return (
    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
      {isBot ? "Vía bot" : "Panel"}
    </span>
  );
}

// ── Reserve / free cell ───────────────────────────────────────────────────────

interface ReserveCellProps {
  slot?: Slot;
  courtId: string;
  courtName: string;
  /** Court default price, used when the slot does not exist yet. */
  priceCents: number;
  dayKey: string;
  band: ScheduleBand;
  /** True when this band was just freed by a cancellation. */
  freed?: boolean;
  onDone: () => void;
}

/**
 * Body for a free cell — whether the slot already exists (AVAILABLE), was just freed by a
 * cancellation, or has to be materialized on the fly at the court's price. Reserve with
 * name + optional phone, or block the slot.
 */
export function ReserveCellForm({
  slot,
  courtId,
  courtName,
  priceCents,
  dayKey,
  band,
  freed = false,
  onDone,
}: ReserveCellProps) {
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [creatingSlot, setCreatingSlot] = useState(false);

  const createBooking = useCreateBooking();
  const updateSlot = useUpdateSlot();
  const createSlot = useCreateSlot();

  const effectivePrice = slot?.priceCents ?? priceCents;
  const busy = creatingSlot || createBooking.isPending || updateSlot.isPending || createSlot.isPending;

  async function ensureSlotId(): Promise<string | null> {
    if (slot) return slot.id;
    const { startsAt, endsAt } = buildSlotDateTimes(dayKey, band);
    try {
      setCreatingSlot(true);
      const created = await slotsService.create({ courtId, startsAt, endsAt, priceCents });
      return created.id;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo crear el turno");
      return null;
    } finally {
      setCreatingSlot(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!playerName.trim()) return;
    const slotId = await ensureSlotId();
    if (!slotId) return;
    createBooking.mutate(
      {
        slotId,
        playerName: playerName.trim(),
        playerPhone: playerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: onDone },
    );
  }

  function handleBlock() {
    if (slot) {
      updateSlot.mutate({ id: slot.id, body: { status: "BLOCKED" } }, { onSuccess: onDone });
      return;
    }
    const { startsAt, endsAt } = buildSlotDateTimes(dayKey, band);
    createSlot.mutate(
      { courtId, startsAt, endsAt, priceCents, status: "BLOCKED" },
      { onSuccess: onDone },
    );
  }

  const timeText = slot ? formatTimeRange(slot.startsAt, slot.endsAt) : `${band.start} – ${band.end}`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <CardHeader
        tone={freed ? "emerald" : "muted"}
        disc={freed ? <RotateCcw className="size-4" /> : <CalendarClock className="size-4" />}
        title={courtName}
        subtitle={`${timeText} · ${formatPrice(effectivePrice)}`}
        badge={
          freed ? (
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Liberado
            </span>
          ) : undefined
        }
      />

      {freed && (
        <p className="text-muted-foreground -mt-1 text-xs">
          Se canceló una reserva en esta franja. Ya está libre para reasignar.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="cell-name">Jugador</Label>
        <Input
          id="cell-name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Juan Pérez"
          maxLength={100}
          autoFocus
          disabled={busy}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cell-phone">
          Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="cell-phone"
          value={playerPhone}
          onChange={(e) => setPlayerPhone(e.target.value)}
          placeholder="+54911…"
          maxLength={20}
          disabled={busy}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cell-notes">
          Notas <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="cell-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones…"
          maxLength={500}
          disabled={busy}
        />
      </div>

      <Button type="submit" disabled={busy || !playerName.trim()} className="w-full">
        {creatingSlot || createBooking.isPending ? "Reservando…" : "Reservar"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={handleBlock}
        className="text-muted-foreground"
      >
        <Lock className="size-3.5" />
        Bloquear turno
      </Button>
    </form>
  );
}

// ── Booked cell ───────────────────────────────────────────────────────────────

/** Body shown when clicking a BOOKED cell: contact + manage the reservation. */
export function BookingActions({
  booking,
  isBot,
  isPast,
  onReschedule,
  onDone,
}: {
  booking: Booking;
  isBot: boolean;
  isPast: boolean;
  onReschedule: () => void;
  onDone: () => void;
}) {
  const cancelBooking = useCancelBooking();
  const [accountOpen, setAccountOpen] = useState(false);
  const totalItems = booking.bookingProducts.reduce((s, p) => s + p.quantity, 0);

  function handleCancel() {
    if (
      window.confirm(
        `¿Cancelar la reserva de ${booking.playerName} (${formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)})?`,
      )
    ) {
      cancelBooking.mutate(booking.id, { onSuccess: onDone });
    }
  }

  const copyText = booking.playerPhone
    ? `${booking.playerName} · ${booking.playerPhone}`
    : booking.playerName;

  return (
    <>
      <div className="flex flex-col gap-3">
        <CardHeader
          tone="brand"
          disc={initials(booking.playerName)}
          title={booking.playerName}
          subtitle={
            <>
              {booking.slot.court.name} · {formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)}
            </>
          }
          badge={<RoleBadge booking={booking} isBot={isBot} />}
        />

        <div className="bg-muted/40 flex flex-col gap-1 rounded-lg px-2.5 py-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Precio</span>
            <span className="font-medium">{formatPrice(booking.slot.priceCents)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Teléfono</span>
            <span className="font-medium">{booking.playerPhone || "—"}</span>
          </div>
          {booking.playerDni && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">DNI</span>
              <span className="font-medium">{booking.playerDni}</span>
            </div>
          )}
        </div>

        {booking.notes && (
          <p className="text-muted-foreground text-xs italic">"{booking.notes}"</p>
        )}

        {isPast && (
          <p className="text-muted-foreground text-[11px]">Este turno ya pasó.</p>
        )}

        <div className="flex items-center gap-2">
          {booking.playerPhone && <WhatsAppLink phone={booking.playerPhone} />}
          <CopyButton value={copyText} label="Copiar datos" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAccountOpen(true)}
          className="w-full justify-start gap-2"
        >
          <ShoppingBasket className="size-3.5" />
          {totalItems > 0 ? `Dividir cuenta (${totalItems})` : "Dividir cuenta"}
        </Button>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReschedule} className="flex-1">
            Reprogramar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={cancelBooking.isPending}
            className="text-muted-foreground hover:text-destructive flex-1"
          >
            {cancelBooking.isPending ? "Cancelando…" : "Cancelar"}
          </Button>
        </div>
      </div>

      <AddProductsDialog
        bookingId={booking.id}
        playerName={booking.playerName}
        courtPriceCents={booking.slot.priceCents}
        currentProducts={booking.bookingProducts}
        open={accountOpen}
        onOpenChange={setAccountOpen}
      />
    </>
  );
}

// ── Pending-payment cell ──────────────────────────────────────────────────────

/** Body shown when clicking a PENDING_PAYMENT hold: confirm the payment or release the slot. */
export function PendingActions({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();
  const { data: config } = useTransferConfig();
  const [accountOpen, setAccountOpen] = useState(false);
  const busy = confirmPayment.isPending || rejectPayment.isPending;
  const totalItems = booking.bookingProducts.reduce((s, p) => s + p.quantity, 0);

  const countdown = timeLeft(booking.paymentExpiresAt);
  const amount = booking.transferAmountCents ?? booking.depositCents;
  // In RECEIPT mode the player must send a receipt photo before the admin can confirm.
  // Admin-created bookings (bookedByUserId !== null) are always confirmable — no player receipt needed.
  const receiptMode = config?.paymentVerificationMode === "RECEIPT";
  const isAdminBooking = booking.bookedByUserId !== null;
  const canConfirm = !receiptMode || booking.hasReceipt || isAdminBooking;

  function handleReject() {
    if (window.confirm(`¿Liberar el turno de ${booking.playerName}? El pago quedará rechazado.`)) {
      rejectPayment.mutate(booking.id, { onSuccess: onDone });
    }
  }

  return (
    <>
    <div className="flex flex-col gap-3">
      <CardHeader
        tone="amber"
        disc={<Hourglass className="size-4" />}
        title={booking.playerName}
        subtitle={
          <>
            {booking.slot.court.name} · {formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)}
          </>
        }
        badge={
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            Esperando pago
          </span>
        }
      />

      <div className="bg-muted/40 flex flex-col gap-1 rounded-lg px-2.5 py-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Wallet className="size-3" />A transferir
          </span>
          <span className="font-medium">{formatPriceExact(amount)}</span>
        </div>
        {countdown && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Vencimiento</span>
            <span className={cn("font-medium", countdown.expired && "text-destructive")}>
              {countdown.label}
            </span>
          </div>
        )}
        {booking.playerDni && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <IdCard className="size-3" />
              DNI
            </span>
            <span className="font-medium">{booking.playerDni}</span>
          </div>
        )}
      </div>

      {booking.hasReceipt ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <FileCheck2 className="size-3.5" />
          El jugador envió un comprobante para revisar.
        </p>
      ) : receiptMode && !isAdminBooking ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Hourglass className="size-3.5" />
          Esperando que el jugador envíe el comprobante.
        </p>
      ) : null}

      {booking.playerPhone && <WhatsAppLink phone={booking.playerPhone} />}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setAccountOpen(true)}
        className="w-full justify-start gap-2"
      >
        <ShoppingBasket className="size-3.5" />
        {totalItems > 0 ? `Dividir cuenta (${totalItems})` : "Dividir cuenta"}
      </Button>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy || !canConfirm}
          title={canConfirm ? undefined : "Falta el comprobante del jugador"}
          onClick={() => confirmPayment.mutate(booking.id, { onSuccess: onDone })}
          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-600/90"
        >
          <Check className="size-3.5" />
          {confirmPayment.isPending ? "Confirmando…" : "Confirmar pago"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={handleReject}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="size-3.5" />
          Liberar
        </Button>
      </div>
    </div>

    <AddProductsDialog
      bookingId={booking.id}
      playerName={booking.playerName}
      courtPriceCents={booking.slot.priceCents}
      currentProducts={booking.bookingProducts}
      open={accountOpen}
      onOpenChange={setAccountOpen}
    />
    </>
  );
}

// ── Blocked cell ──────────────────────────────────────────────────────────────

/** Body shown when clicking a BLOCKED cell: free it or delete it. */
export function BlockedActions({ slot, onDone }: { slot: Slot; onDone: () => void }) {
  const updateSlot = useUpdateSlot();
  const deleteSlot = useDeleteSlot();
  const busy = updateSlot.isPending || deleteSlot.isPending;

  return (
    <div className="flex flex-col gap-3">
      <CardHeader
        tone="muted"
        disc={<Lock className="size-4" />}
        title={slot.court.name}
        subtitle={`${formatTimeRange(slot.startsAt, slot.endsAt)} · Bloqueado`}
      />
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() =>
          updateSlot.mutate({ id: slot.id, body: { status: "AVAILABLE" } }, { onSuccess: onDone })
        }
        className="w-full"
      >
        Liberar turno
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() => deleteSlot.mutate(slot.id, { onSuccess: onDone })}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
        Eliminar turno
      </Button>
    </div>
  );
}
