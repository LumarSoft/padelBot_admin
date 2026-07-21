"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { StepLayout } from "@/features/setup/components/step-layout";
import { StepFooter } from "@/features/setup/components/step-footer";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { bandsForWeekday } from "@/features/agenda/lib/schedule";
import {
  useCreateRecurringBooking,
  useDeleteRecurringBooking,
  useRecurringBookings,
} from "@/features/configuracion/hooks/use-recurring-bookings";
import type { StepProps } from "@/features/setup/components/setup-wizard";

const DAYS = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
  { value: "0", label: "Domingo" },
];

function dayLabel(value: number): string {
  return DAYS.find((d) => d.value === String(value))?.label ?? "";
}

export function FijosStep({ nav }: StepProps) {
  const courtsQuery = useCourts();
  const fijosQuery = useRecurringBookings();
  const createFijo = useCreateRecurringBooking();
  const deleteFijo = useDeleteRecurringBooking();

  const courts = courtsQuery.data ?? [];
  const fijos = fijosQuery.data ?? [];

  const [courtId, setCourtId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [bandStart, setBandStart] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");

  const selectedCourt = courts.find((c) => c.id === courtId) ?? courts[0];
  const effectiveCourtId = selectedCourt?.id ?? "";
  const schedule = selectedCourt ? bandsForWeekday(selectedCourt, Number(dayOfWeek)) : [];
  const effectiveBandStart = bandStart || schedule[0]?.start || "";

  const canAdd =
    !!effectiveCourtId &&
    !!effectiveBandStart &&
    playerName.trim().length > 0 &&
    playerPhone.trim().length >= 6 &&
    !createFijo.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const band = schedule.find((b) => b.start === effectiveBandStart);
    if (!band || !canAdd || !selectedCourt) return;

    createFijo.mutate(
      {
        courtId: effectiveCourtId,
        dayOfWeek: Number(dayOfWeek),
        slotStart: band.start,
        slotEnd: band.end,
        playerName: playerName.trim(),
        playerPhone: playerPhone.trim(),
        priceCents: selectedCourt.priceCents,
      },
      {
        // Keep the court, day and time so the next fixed slot of the same batch is two
        // fields away — this step is transcription from a notebook, not a one-off form.
        onSuccess: () => {
          setPlayerName("");
          setPlayerPhone("");
        },
      },
    );
  }

  if (courtsQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    );
  }

  // Fixed slots hang off a court, so with no courts there's nothing to attach them to.
  if (courts.length === 0) {
    return (
      <StepLayout id="fijos" footer={<StepFooter nav={nav} skipLabel="Continuar" />}>
        <EmptyState
          icon={CalendarClock}
          title="Primero necesitás canchas"
          description="Un turno fijo se agenda sobre una cancha. Volvé al paso de canchas, cargalas y después volvé acá."
        />
      </StepLayout>
    );
  }

  return (
    <StepLayout
      id="fijos"
      footer={
        <StepFooter
          nav={nav}
          skipLabel={fijos.length > 0 ? "Omitir por ahora" : "No tengo fijos"}
        />
      }
    >
      <div className="border-border/60 bg-card/40 rounded-xl border p-4">
        <p className="text-sm text-pretty">
          Cargá los que ya juegan todas las semanas. Se bloquean solos en la agenda, semana
          a semana, y el bot deja de ofrecer esos horarios.
        </p>
      </div>

      {fijos.length > 0 && (
        <div className="flex flex-col gap-2">
          {fijos.map((fijo) => (
            <Card key={fijo.id} size="sm" className="animate-fade-up">
              <CardContent className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{fijo.playerName}</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {dayLabel(fijo.dayOfWeek)} {fijo.slotStart}–{fijo.slotEnd} ·{" "}
                    {fijo.court.name} · {formatPrice(fijo.priceCents)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Eliminar el fijo de ${fijo.playerName}`}
                  onClick={() => deleteFijo.mutate(fijo.id)}
                  disabled={deleteFijo.isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>Cancha</Label>
            <Select
              value={effectiveCourtId}
              onValueChange={(v) => {
                setCourtId((v as string) ?? "");
                setBandStart("");
              }}
            >
              <SelectTrigger disabled={createFijo.isPending}>
                <SelectValue>
                  {(v) => courts.find((c) => c.id === v)?.name ?? "Elegí"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Día</Label>
            <Select
              value={dayOfWeek}
              onValueChange={(v) => {
                setDayOfWeek((v as string) ?? "1");
                setBandStart("");
              }}
            >
              <SelectTrigger disabled={createFijo.isPending}>
                <SelectValue>{(v) => dayLabel(Number(v))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Horario</Label>
            <Select
              value={effectiveBandStart}
              onValueChange={(v) => setBandStart((v as string) ?? "")}
            >
              <SelectTrigger disabled={createFijo.isPending || schedule.length === 0}>
                <SelectValue>{(v) => (v as string) || "—"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {schedule.map((band) => (
                  <SelectItem key={band.start} value={band.start}>
                    {band.start} – {band.end}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {schedule.length === 0 && (
              <p className="text-muted-foreground text-xs">
                Esa cancha está cerrada ese día.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="setup-fijo-name">Quién juega</Label>
            <Input
              id="setup-fijo-name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Grupo de Martínez"
              maxLength={80}
              disabled={createFijo.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="setup-fijo-phone">Teléfono</Label>
            <Input
              id="setup-fijo-phone"
              type="tel"
              value={playerPhone}
              onChange={(e) => setPlayerPhone(e.target.value)}
              placeholder="+54 9 341 555-5555"
              maxLength={30}
              disabled={createFijo.isPending}
            />
          </div>
        </div>

        <div>
          <Button type="submit" variant="outline" disabled={!canAdd}>
            {createFijo.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Agregando…
              </>
            ) : (
              <>
                <Plus />
                Agregar turno fijo
              </>
            )}
          </Button>
          <p className="text-muted-foreground mt-2 text-xs">
            Se cobra al precio de la cancha ({selectedCourt ? formatPrice(selectedCourt.priceCents) : "—"}).
            Podés cambiarlo después desde Configuración.
          </p>
        </div>
      </form>
    </StepLayout>
  );
}
