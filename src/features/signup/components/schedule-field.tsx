"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CLOSE,
  DEFAULT_OPEN,
  FALLBACK_DURATION,
  bandsFor,
  closeOptions,
  openOptions,
} from "@/features/signup/lib/schedule-preview";
import type { SignupAnswers } from "@/features/signup/lib/questions";

/**
 * Opening hours, shown as the thing they actually produce: the day's turnos.
 *
 * Two bare time inputs asked the club to do the arithmetic in their head and hope we did
 * the same. Here they pick when they open and close and immediately see the grid the bot
 * would offer — the exact shape of their day — so a wrong answer is obvious on the spot.
 * The last turno has to END by the closing time, so a trailing gap too short for another
 * one simply isn't offered, same as in the panel.
 */
export function ScheduleField({
  answers,
  onAnswer,
}: {
  answers: SignupAnswers;
  onAnswer: (key: keyof SignupAnswers, value: unknown) => void;
}) {
  const open = answers.openTime || DEFAULT_OPEN;
  const close = answers.closeTime || DEFAULT_CLOSE;
  // "Depende de la cancha" still needs a number to draw with; say so rather than hide it.
  const duration = answers.slotDurationMinutes ?? FALLBACK_DURATION;
  const assumed = answers.slotDurationMinutes == null;

  const bands = bandsFor(open, close, duration);
  const closes = closeOptions(open, duration);

  function setOpen(next: string): void {
    onAnswer("openTime", next);
    // A closing time that's now before the club could fit one turno would leave them
    // staring at an empty grid — pull it forward to the first one that works.
    if (!closeOptions(next, duration).includes(close)) {
      onAnswer("closeTime", closeOptions(next, duration)[0]);
    }
  }

  return (
    <div data-animate="option" className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Abre</Label>
          <Select value={open} onValueChange={(v) => setOpen((v as string) || DEFAULT_OPEN)}>
            <SelectTrigger className="h-12 w-full rounded-xl text-base">
              <SelectValue>{(v) => v as string}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {openOptions().map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Cierra</Label>
          <Select
            value={close}
            onValueChange={(v) => onAnswer("closeTime", (v as string) || DEFAULT_CLOSE)}
          >
            <SelectTrigger className="h-12 w-full rounded-xl text-base">
              <SelectValue>
                {(v) => ((v as string) === "00:00" ? "00:00 (medianoche)" : (v as string))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {closes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "00:00" ? "00:00 (medianoche)" : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* The day, as the bot would offer it. */}
      <div className="border-border/70 bg-card/40 flex flex-col gap-3 rounded-2xl border p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">Así te quedaría el día</p>
          <span className="text-muted-foreground text-xs tabular-nums">
            {bands.length} turno{bands.length === 1 ? "" : "s"} por cancha
          </span>
        </div>

        {bands.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Con ese horario no entra ningún turno completo. Probá abriendo antes o cerrando
            más tarde.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {bands.map((band, i) => (
              <span
                key={band.start}
                className={cn(
                  "animate-scale-in border-border/60 bg-background/70 rounded-lg border px-2 py-1 text-xs tabular-nums",
                  // The last one is what they'll double-check: it's when the lights go off.
                  i === bands.length - 1 && "border-brand/50 bg-brand/10 font-medium",
                )}
                style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
              >
                {band.start}–{band.end}
              </span>
            ))}
          </div>
        )}

        <p className="text-muted-foreground text-xs text-pretty">
          {assumed
            ? `Como los turnos dependen de la cancha, lo dibujamos con ${FALLBACK_DURATION} min. Lo afinamos juntos.`
            : `Turnos de ${duration} min. El último termina justo antes de cerrar.`}
        </p>
      </div>
    </div>
  );
}
