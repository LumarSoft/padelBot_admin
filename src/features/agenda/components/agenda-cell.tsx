"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
  ReserveCellForm,
} from "@/features/agenda/components/cell-popovers";
import type { ScheduleBand } from "@/features/agenda/lib/schedule";
import type { AgendaCellData } from "@/features/agenda/hooks/use-agenda-day";

interface AgendaCellProps {
  courtId: string;
  courtName: string;
  courtPriceCents: number;
  dayKey: string;
  band: ScheduleBand;
  data: AgendaCellData;
}

type CellKind = "booked" | "available" | "blocked" | "empty";

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

  const { slot, booking } = data;
  const kind: CellKind = booking
    ? "booked"
    : slot?.status === "BLOCKED"
      ? "blocked"
      : slot
        ? "available"
        : "empty";

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex h-14 w-full flex-col items-start justify-center gap-0.5 rounded-lg border px-2 text-left text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            kind === "booked" &&
              "border-brand/30 bg-brand/10 hover:bg-brand/15 text-foreground",
            kind === "available" &&
              "border-border hover:border-foreground/20 hover:bg-accent",
            kind === "blocked" &&
              "border-dashed border-destructive/30 bg-destructive/5 text-muted-foreground",
            kind === "empty" &&
              "text-muted-foreground/50 hover:text-muted-foreground border-dashed border-border/60 hover:bg-accent/50",
          )}
        >
          {kind === "booked" && (
            <>
              <span className="line-clamp-1 font-medium">{booking!.playerName}</span>
              <span className="text-muted-foreground flex items-center gap-1">
                {booking!.recurringBookingId && (
                  <span className="bg-brand/15 text-brand rounded px-1 text-[9px] font-medium">
                    Fijo
                  </span>
                )}
                {formatPrice(booking!.slot.priceCents)}
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

        <PopoverContent align="start">
          {kind === "booked" && (
            <BookingActions
              booking={booking!}
              onReschedule={() => {
                setOpen(false);
                setRescheduling(true);
              }}
              onDone={close}
            />
          )}
          {(kind === "available" || kind === "empty") && (
            <ReserveCellForm
              slot={slot}
              courtId={courtId}
              courtName={courtName}
              priceCents={courtPriceCents}
              dayKey={dayKey}
              band={band}
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
