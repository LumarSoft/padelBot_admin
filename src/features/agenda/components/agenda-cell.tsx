"use client";

import { useState } from "react";
import { Check, Plus, CheckCircle2, Hourglass, RotateCcw, FileCheck2, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { paidDepositCents } from "@/lib/booking-account";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RescheduleBookingDialog } from "@/features/reservas/components/reschedule-booking-dialog";
import {
  BookingActions,
  BlockedActions,
  PendingActions,
  ReserveCellForm,
} from "@/features/agenda/components/cell-popovers";
import { buildSlotDateTimes, type ScheduleBand } from "@/features/agenda/lib/schedule";
import type { AgendaCellData } from "@/features/agenda/hooks/use-agenda-day";

interface AgendaCellProps {
  courtId: string;
  courtName: string;
  courtPriceCents: number;
  dayKey: string;
  band: ScheduleBand;
  data: AgendaCellData;
  /** When true, the cell is a checkbox for bulk block/unblock instead of a popover. */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

type CellKind = "booked" | "pending" | "freed" | "available" | "blocked" | "empty";

export function AgendaCell({
  courtId,
  courtName,
  courtPriceCents,
  dayKey,
  band,
  data,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: AgendaCellProps) {
  const [open, setOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const { slot, booking, pending, freed } = data;
  const kind: CellKind = booking
    ? "booked"
    : pending
      ? "pending"
      : slot?.status === "BLOCKED"
        ? "blocked"
        : freed
          ? "freed"
          : slot
            ? "available"
            : "empty";

  const isPast = new Date(buildSlotDateTimes(dayKey, band).endsAt) < new Date();
  const isBot = booking ? booking.bookedByUserId === null : false;
  const depositPaid = booking ? paidDepositCents(booking) : 0;
  // Cuenta completa: the settled turno keeps its color even in the past — that green
  // check is exactly what the desk scans for ("¿quedó alguna cuenta abierta?").
  const isSettled = booking?.settledAt != null;

  // Past free cells: no booking form should open — only past booked/pending/blocked remain interactive.
  const isDisabled = isPast && (kind === "available" || kind === "empty" || kind === "freed");

  function close() {
    setOpen(false);
  }

  // The colored surface, shared by the popover trigger and the selection checkbox.
  const cellClass = cn(
    "ease-fluid flex h-14 w-full flex-col items-start justify-center gap-0.5 rounded-lg border px-2 text-left text-xs transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97]",
    kind === "booked" &&
      (isSettled
        ? "border-emerald-500/70 bg-emerald-500/20 text-foreground"
        : "border-brand/30 bg-brand/10 text-foreground"),
    kind === "pending" && "border-amber-400/50 bg-amber-400/10 text-foreground",
    kind === "freed" && "border-emerald-400/40 bg-emerald-400/[0.07] text-foreground",
    kind === "available" && "border-emerald-400/50 bg-emerald-400/[0.18] text-foreground",
    kind === "blocked" && "border-dashed border-destructive/30 bg-destructive/5 text-muted-foreground",
    kind === "empty" && "border-dashed border-emerald-400/30 bg-emerald-400/[0.08] text-muted-foreground/70",
  );

  const content = (
    <>
      {kind === "booked" && isSettled && (
        <>
          <span className="line-clamp-1 font-medium">{booking!.playerName}</span>
          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            Finalizado
          </span>
        </>
      )}

      {kind === "booked" && !isSettled && (
        <>
          <span className="line-clamp-1 font-medium">{booking!.playerName}</span>
          <span className="text-muted-foreground flex items-center gap-1">
            {booking!.recurringBookingId ? (
              <span className="bg-brand/15 text-brand inline-flex items-center gap-0.5 rounded px-1 text-[9px] font-medium">
                <Repeat className="size-2.5" />
                Fijo
              </span>
            ) : isBot ? (
              <span className="bg-muted text-muted-foreground rounded px-1 text-[9px] font-medium">
                Bot
              </span>
            ) : null}
            {formatPrice(booking!.slot.priceCents)}
            {depositPaid > 0 && (
              <span
                className="inline-flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400"
                title={`Seña de ${formatPrice(depositPaid)} paga`}
              >
                <CheckCircle2 className="size-2.5" />
                seña
              </span>
            )}
          </span>
        </>
      )}

      {kind === "pending" && (
        <>
          <span className="line-clamp-1 font-medium">{pending!.playerName}</span>
          <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
            {pending!.hasReceipt ? (
              <>
                <FileCheck2 className="size-3" />
                Revisar pago
              </>
            ) : (
              <>
                <Hourglass className="size-3" />
                Esperando pago
              </>
            )}
          </span>
        </>
      )}

      {kind === "freed" && (
        <>
          <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
            <RotateCcw className="size-3" />
            Liberado
          </span>
          <span className="text-muted-foreground">
            {formatPrice(slot?.priceCents ?? courtPriceCents)}
          </span>
        </>
      )}

      {kind === "available" && (
        <>
          <span className="font-medium">Libre</span>
          <span className="text-muted-foreground">{formatPrice(slot!.priceCents)}</span>
        </>
      )}

      {kind === "blocked" && <span className="font-medium">Bloqueado</span>}

      {kind === "empty" && (
        <span className="flex items-center gap-1">
          <Plus className="size-3.5" />
          {formatPrice(courtPriceCents)}
        </span>
      )}
    </>
  );

  // ── Selection mode: cell becomes a checkbox for bulk block/unblock ────────────
  if (selectionMode) {
    // Reserved/held turnos are protected; past free cells aren't worth blocking.
    const selectable = !isPast && kind !== "booked" && kind !== "pending";
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`${courtName} ${band.start}`}
        disabled={!selectable}
        onClick={selectable ? onToggleSelect : undefined}
        className={cn(
          "relative",
          cellClass,
          selectable ? "cursor-pointer" : "cursor-not-allowed opacity-40",
          selected && "ring-brand border-brand ring-2",
        )}
      >
        {selectable && (
          <span
            className={cn(
              "absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded border transition-colors",
              selected
                ? "border-brand bg-brand text-white"
                : "border-muted-foreground/40 bg-background/60",
            )}
          >
            {selected && <Check className="size-3" strokeWidth={3} />}
          </span>
        )}
        {content}
      </button>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={isDisabled}
          style={
            isPast && kind !== "pending" && !isSettled
              ? { opacity: 0.45, filter: "grayscale(1)" }
              : undefined
          }
          className={cn(
            cellClass,
            "data-popup-open:scale-[0.97] data-popup-open:ring-2 data-popup-open:ring-brand/40",
            kind === "booked" &&
              (isSettled ? "hover:bg-emerald-500/[0.28]" : "hover:bg-brand/15"),
            kind === "pending" && "hover:bg-amber-400/20",
            kind === "freed" && "hover:bg-emerald-400/15",
            kind === "available" && "hover:bg-emerald-400/[0.28] hover:border-emerald-400/70",
            kind === "empty" && "hover:bg-emerald-400/[0.16]",
            isDisabled && "cursor-not-allowed",
          )}
        >
          {content}
        </PopoverTrigger>

        <PopoverContent align="start" className="w-72">
          {kind === "booked" && (
            <BookingActions
              booking={booking!}
              isBot={isBot}
              isPast={isPast}
              onReschedule={() => {
                setOpen(false);
                setRescheduling(true);
              }}
              onDone={close}
            />
          )}
          {kind === "pending" && <PendingActions booking={pending!} onDone={close} />}
          {(kind === "available" || kind === "freed" || kind === "empty") && (
            <ReserveCellForm
              slot={slot}
              courtId={courtId}
              courtName={courtName}
              priceCents={courtPriceCents}
              dayKey={dayKey}
              band={band}
              freed={kind === "freed"}
              onDone={close}
            />
          )}
          {kind === "blocked" && <BlockedActions slot={slot!} onDone={close} />}
        </PopoverContent>
      </Popover>

      {booking && (
        <RescheduleBookingDialog
          booking={booking}
          open={rescheduling}
          onOpenChange={setRescheduling}
        />
      )}
    </>
  );
}
