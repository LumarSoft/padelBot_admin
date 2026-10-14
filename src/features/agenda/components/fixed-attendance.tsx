"use client";

import { Check, CheckCircle2, Clock, Loader2, Phone, PhoneCall, Repeat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";
import { useBookings } from "@/features/reservas/hooks/use-bookings";
import { useFixedConfirmation } from "@/features/configuracion/hooks/use-fixed-confirmation";
import { useSetAttendance } from "@/features/agenda/hooks/use-set-attendance";
import {
  askTime,
  attendanceState,
  fijosToCall,
  telLink,
  type FijoToCall,
} from "@/features/agenda/lib/attendance";
import {
  CLUB_TIMEZONE,
  dateToKey,
  dayRange,
  dayRangeForCourts,
  formatDayLabel,
  localHHMM,
  shiftDay,
  todayKey,
} from "@/features/agenda/lib/schedule";
import type { Booking } from "@/types/api/bookings";
import type { Court } from "@/types/api/turnos";

const weekdayFormat = new Intl.DateTimeFormat("es-AR", { timeZone: CLUB_TIMEZONE, weekday: "long" });

/** "hoy 19:00" / "ayer 19:00" / "mañana 10:00" / "jueves 16/10 19:00", in club time. */
function whenLabel(iso: string): string {
  const key = dateToKey(new Date(iso));
  const today = todayKey();
  const time = localHHMM(iso);
  if (key === today) return `hoy ${time}`;
  if (key === shiftDay(today, -1)) return `ayer ${time}`;
  if (key === shiftDay(today, 1)) return `mañana ${time}`;
  const [, m, d] = key.split("-");
  return `${weekdayFormat.format(new Date(iso))} ${d}/${m} ${time}`;
}

// ── Cell badge ────────────────────────────────────────────────────────────────

/**
 * The fijo badge on an agenda cell, carrying the answer to the WhatsApp "¿venís?": green
 * "Viene" once they confirmed, amber "Sin resp." when we asked and they didn't answer, the
 * plain "Fijo" otherwise (not asked yet, or the feature is off).
 */
export function FijoBadge({ booking }: { booking: Booking }) {
  const state = attendanceState(booking);
  if (state === "confirmed") {
    return (
      <span
        title="Turno fijo: confirmó que viene"
        className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-400"
      >
        <Check className="size-2.5" />
        Viene
      </span>
    );
  }
  if (state === "unanswered") {
    return (
      <span
        title="Turno fijo: le preguntamos por WhatsApp si viene y todavía no respondió"
        className="inline-flex items-center gap-0.5 rounded bg-amber-400/20 px-1 text-[9px] font-medium text-amber-700 dark:text-amber-400"
      >
        <Phone className="size-2.5" />
        Sin resp.
      </span>
    );
  }
  return (
    <span className="bg-brand/15 text-brand inline-flex items-center gap-0.5 rounded px-1 text-[9px] font-medium">
      <Repeat className="size-2.5" />
      Fijo
    </span>
  );
}

// ── Answer buttons (shared by the cell popover and the "sin respuesta" list) ───────────

function AnswerButtons({
  booking,
  showComing = true,
  onDone,
}: {
  booking: Booking;
  showComing?: boolean;
  onDone?: () => void;
}) {
  const setAttendance = useSetAttendance();
  const confirm = useConfirm();
  const pending = setAttendance.isPending;
  const pendingAnswer = setAttendance.variables?.confirmed;

  async function handleNotComing() {
    const ok = await confirm({
      title: `¿${booking.playerName} no viene?`,
      description: `Liberamos solo este turno (${booking.slot.court.name}, ${whenLabel(booking.slot.startsAt)}) para que lo use otra persona, y le avisamos a la lista de espera. Las próximas semanas su turno fijo sigue igual.`,
      confirmLabel: "Sí, liberar este turno",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) setAttendance.mutate({ id: booking.id, confirmed: false }, { onSuccess: onDone });
  }

  return (
    <div className="flex gap-2">
      {showComing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setAttendance.mutate({ id: booking.id, confirmed: true }, { onSuccess: onDone })}
          className="flex-1 border-emerald-500/40 text-emerald-700 hover:text-emerald-700 dark:text-emerald-400"
        >
          {pending && pendingAnswer === true ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Check />
          )}
          Viene
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={handleNotComing}
        className="text-muted-foreground hover:text-destructive flex-1"
      >
        {pending && pendingAnswer === false ? <Loader2 className="animate-spin" /> : <X />}
        No viene
      </Button>
    </div>
  );
}

// ── Cell popover block ──────────────────────────────────────────────────────────

/**
 * The fijo's "¿viene?" inside the booked-cell popover: what the bot asked and what they
 * answered, plus "Viene" / "No viene" for the desk to record a phone call. Hidden while the
 * automatic question is off for the club.
 */
export function FixedAttendanceBlock({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const config = useFixedConfirmation();
  const state = attendanceState(booking);
  if (!config.data?.enabled || state === null || state === "declined") return null;

  if (state === "confirmed") {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5 shrink-0" />
          Confirmó que viene
          {booking.attendanceAnsweredAt && (
            <span className="font-normal opacity-80">· {whenLabel(booking.attendanceAnsweredAt)}</span>
          )}
        </p>
        <AnswerButtons booking={booking} showComing={false} onDone={onDone} />
      </div>
    );
  }

  const askAt = askTime(booking, config.data.leadHours);
  // Same "now" as the agenda grid's isPast check: read once per render.
  const askIsAhead = askAt.getTime() > new Date().getTime();
  const message =
    state === "unanswered"
      ? `Le preguntamos por WhatsApp ${whenLabel(booking.attendanceAskedAt!)} si viene y todavía no respondió. Llamalo y marcá lo que te diga.`
      : askIsAhead
        ? `El bot le va a preguntar por WhatsApp si viene ${whenLabel(askAt.toISOString())}.`
        : "No le pudimos escribir por WhatsApp. Llamalo y marcá lo que te diga.";

  return (
    <div className="flex flex-col gap-2">
      <p
        className={cn(
          "flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs",
          state === "unanswered" || !askIsAhead
            ? "border-amber-400/50 bg-amber-400/10 text-amber-800 dark:text-amber-300"
            : "border-border/70 bg-muted/40 text-muted-foreground",
        )}
      >
        <Clock className="mt-0.5 size-3.5 shrink-0" />
        {message}
      </p>
      <AnswerButtons booking={booking} onDone={onDone} />
    </div>
  );
}

// ── "Fijos sin respuesta" (agenda toolbar) ───────────────────────────────────────

const REASON_LABEL: Record<FijoToCall["reason"], string> = {
  unanswered: "No respondió el WhatsApp",
  notReached: "No le llegó el WhatsApp",
};

function FijoToCallRow({ item }: { item: FijoToCall }) {
  const { booking, reason } = item;
  return (
    <li className="border-border/60 flex flex-col gap-2 border-t py-2.5 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{booking.playerName}</p>
          <p className="text-muted-foreground text-xs">
            {localHHMM(booking.slot.startsAt)} · {booking.slot.court.name} · {REASON_LABEL[reason]}
          </p>
        </div>
      </div>
      {booking.playerPhone ? (
        <div className="flex items-center gap-2">
          <a
            href={telLink(booking.playerPhone)}
            className="bg-muted/60 hover:bg-muted inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium tabular-nums transition-colors"
          >
            <PhoneCall className="size-3.5" />
            {booking.playerPhone}
          </a>
          <a
            href={waLink(booking.playerPhone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escribirle a ${booking.playerName} por WhatsApp`}
            className="inline-flex size-7 items-center justify-center rounded-lg bg-[#25D366] text-white transition-opacity hover:opacity-90"
          >
            <WhatsAppIcon className="size-3.5" />
          </a>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">No tiene teléfono cargado.</p>
      )}
      <AnswerButtons booking={booking} />
    </li>
  );
}

/**
 * The front desk's call list: today's (or the viewed day's) fijos that didn't answer the
 * WhatsApp "¿venís?", with the phone to call and a tap to record what they said. Only shown
 * while the automatic question is on and the day has fijos.
 */
export function UnansweredFijos({ dayKey, courts }: { dayKey: string; courts: Court[] }) {
  const config = useFixedConfirmation();
  const range = courts.length ? dayRangeForCourts(dayKey, courts) : dayRange(dayKey);
  // Same filters as the agenda grid without a court filter, so these share its cache.
  const confirmedQuery = useBookings({ from: range.from, to: range.to, status: "CONFIRMED" });
  const cancelledQuery = useBookings({ from: range.from, to: range.to, status: "CANCELLED" });

  if (!config.data?.enabled) return null;

  const fijos = (confirmedQuery.data ?? []).filter((b) => b.recurringBookingId);
  const declined = (cancelledQuery.data ?? []).filter((b) => attendanceState(b) === "declined");
  if (fijos.length === 0 && declined.length === 0) return null;

  const toCall = fijosToCall(fijos, config.data.leadHours);
  const coming = fijos.filter((b) => attendanceState(b) === "confirmed").length;
  const dayName = dayKey === todayKey() ? "de hoy" : `del ${formatDayLabel(dayKey)}`;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              toCall.length > 0 &&
                "border-amber-400/60 text-amber-700 hover:text-amber-700 dark:text-amber-400",
            )}
          />
        }
      >
        {toCall.length > 0 ? <PhoneCall /> : <CheckCircle2 className="text-emerald-600" />}
        {toCall.length > 0
          ? `${toCall.length} ${toCall.length === 1 ? "fijo" : "fijos"} sin respuesta`
          : "Fijos al día"}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="flex flex-col gap-3">
          <header className="space-y-1">
            <p className="font-heading text-sm font-semibold">Fijos sin respuesta {dayName}</p>
            <p className="text-muted-foreground text-xs text-pretty">
              El bot les pregunta por WhatsApp si vienen. Estos no contestaron: llamalos y marcá
              lo que te digan. Si nadie responde, el turno sigue reservado.
            </p>
          </header>

          {toCall.length > 0 ? (
            <ul className="flex max-h-96 flex-col overflow-y-auto">
              {toCall.map((item) => (
                <FijoToCallRow key={item.booking.id} item={item} />
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              No hay nadie para llamar por ahora.
            </p>
          )}

          <p className="text-muted-foreground border-border/60 border-t pt-2 text-xs">
            Vienen: <span className="text-foreground font-medium">{coming}</span> · No vienen:{" "}
            <span className="text-foreground font-medium">{declined.length}</span> · Fijos del
            día: <span className="text-foreground font-medium">{fijos.length + declined.length}</span>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
