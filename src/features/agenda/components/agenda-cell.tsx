"use client";

import { useState } from "react";
import { Plus, Hourglass, RotateCcw, FileCheck2, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
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
}

type CellKind = "booked" | "pending" | "freed" | "available" | "blocked" | "empty";

export function AgendaCell({
  courtId,
  courtName,
  courtPriceCents,
  dayKey,
  band,
  data,
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

  // A band whose end time is already in the past — dim it so the eye skips it.
  const isPast = new Date(buildSlotDateTimes(dayKey, band).endsAt) < new Date();
  const isBot = booking ? booking.bookedByUserId === null : false;

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex h-14 w-full flex-col items-start justify-center gap-0.5 rounded-lg border px-2 text-left text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            kind === "booked" && "border-brand/30 bg-brand/10 hover:bg-brand/15 text-foreground",
            kind === "pending" &&
              "border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20 text-foreground",
            kind === "freed" &&
              "border-emerald-400/40 bg-emerald-400/[0.07] hover:bg-emerald-400/15 text-foreground",
            kind === "available" && "border-border hover:border-foreground/20 hover:bg-accent",
            kind === "blocked" &&
              "border-dashed border-destructive/30 bg-destructive/5 text-muted-foreground",
            kind === "empty" &&
              "text-muted-foreground/50 hover:text-muted-foreground border-dashed border-border/60 hover:bg-accent/50",
            isPast && kind !== "pending" && "opacity-55",
          )}
        >
          {kind === "booked" && (
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
