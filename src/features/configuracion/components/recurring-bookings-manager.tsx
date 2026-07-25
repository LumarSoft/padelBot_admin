"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus, RefreshCw, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import {
  SettingsEmpty,
  SettingsSection,
} from "@/features/configuracion/components/settings-section";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { bandsForWeekday, todayKey } from "@/features/agenda/lib/schedule";
import {
  useRecurringBookings,
  useCreateRecurringBooking,
  useDeleteRecurringBooking,
  useApplyRecurringBooking,
  useUpdateRecurringBooking,
} from "@/features/configuracion/hooks/use-recurring-bookings";
import type { Court } from "@/types/api/turnos";
import type { RecurringBooking } from "@/types/api/recurring";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

function dayLabel(value: number): string {
  return DAYS.find((d) => d.value === value)?.label ?? "";
}

function CreateRecurringDialog({ courts }: { courts: Court[] }) {
  const [open, setOpen] = useState(false);
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [bandStart, setBandStart] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [price, setPrice] = useState(() => String((courts[0]?.priceCents ?? 0) / 100));
  const [untilDate, setUntilDate] = useState("");
  const createRecurring = useCreateRecurringBooking();

  const selectedCourt = courts.find((c) => c.id === courtId);
  // Bands depend on the chosen weekday (per-day opening hours can differ).
  const schedule = selectedCourt ? bandsForWeekday(selectedCourt, Number(dayOfWeek)) : [];
  const effectiveBandStart = bandStart || schedule[0]?.start || "";

  const priceNumber = Number(price);
  const priceValid = Number.isFinite(priceNumber) && priceNumber >= 0;
  const canSubmit =
    !!courtId &&
    !!playerName.trim() &&
    playerPhone.trim().length >= 6 &&
    priceValid &&
    !!effectiveBandStart &&
    !createRecurring.isPending;

  function reset() {
    setCourtId(courts[0]?.id ?? "");
    setDayOfWeek("1");
    setBandStart("");
    setPlayerName("");
    setPlayerPhone("");
    setPrice(String((courts[0]?.priceCents ?? 0) / 100));
    setUntilDate("");
  }

  function handleCourtChange(value: string | null) {
    const next = value ?? "";
    setCourtId(next);
    setBandStart("");
    const court = courts.find((c) => c.id === next);
    if (court) setPrice(String(court.priceCents / 100));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const band = schedule.find((b) => b.start === effectiveBandStart);
    if (!band || !canSubmit) return;
    createRecurring.mutate(
      {
        courtId,
        dayOfWeek: Number(dayOfWeek),
        slotStart: band.start,
        slotEnd: band.end,
        playerName: playerName.trim(),
        playerPhone: playerPhone.trim(),
        priceCents: Math.round(priceNumber * 100),
        ...(untilDate ? { untilDate } : {}),
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="size-4" />
        Nuevo turno fijo
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo turno fijo</DialogTitle>
          <DialogDescription>
            Se repite todas las semanas y bloquea esos horarios automáticamente (quedan
            reservados, sin pedir seña). Solo se cargan desde el panel, nunca por el bot.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Cancha</Label>
              <Select value={courtId} onValueChange={handleCourtChange}>
                <SelectTrigger>
                  <SelectValue>
                    {(v) => courts.find((c) => c.id === v)?.name ?? ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {courts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
                  setDayOfWeek(v ?? "1");
                  // The new day may have different bands — drop the stale selection.
                  setBandStart("");
                }}
              >
                <SelectTrigger>
                  <SelectValue>{(v) => dayLabel(Number(v))}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Horario</Label>
            <Select
              value={effectiveBandStart}
              onValueChange={(v) => setBandStart(v ?? schedule[0]?.start ?? "")}
            >
              <SelectTrigger>
                <SelectValue>
                  {(v) => {
                    const band = schedule.find((b) => b.start === v);
                    return band ? `${band.start} – ${band.end}` : "";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {schedule.map((b) => (
                  <SelectItem key={b.start} value={b.start}>
                    {b.start} – {b.end}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rb-name">Jugador</Label>
              <Input
                id="rb-name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Juan Pérez"
                maxLength={100}
                disabled={createRecurring.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rb-phone">Teléfono</Label>
              <Input
                id="rb-phone"
                value={playerPhone}
                onChange={(e) => setPlayerPhone(e.target.value)}
                placeholder="+54911…"
                maxLength={20}
                disabled={createRecurring.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rb-price">Precio (ARS)</Label>
              <Input
                id="rb-price"
                type="number"
                inputMode="numeric"
                min={0}
                step={500}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={createRecurring.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rb-until">Bloquear hasta</Label>
              <Input
                id="rb-until"
                type="date"
                min={todayKey()}
                value={untilDate}
                onChange={(e) => setUntilDate(e.target.value)}
                disabled={createRecurring.isPending}
              />
              <p className="text-muted-foreground text-xs">Opcional. Vacío = sin fecha de fin.</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {createRecurring.isPending ? "Creando…" : "Crear turno fijo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecurringBookingsManager() {
  const courtsQuery = useCourts();
  const courts = courtsQuery.data ?? [];
  const recurringQuery = useRecurringBookings();
  const recurring = recurringQuery.data ?? [];

  const deleteRecurring = useDeleteRecurringBooking();
  const confirm = useConfirm();
  const applyRecurring = useApplyRecurringBooking();
  const updateRecurring = useUpdateRecurringBooking();

  async function handleDelete(rb: RecurringBooking) {
    const ok = await confirm({
      title: `¿Eliminar el turno fijo de ${rb.playerName}?`,
      description: `${dayLabel(rb.dayOfWeek)} ${rb.slotStart}. Deja de generar turnos nuevos; las reservas ya generadas quedan en la agenda.`,
      confirmLabel: "Eliminar el fijo",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) deleteRecurring.mutate(rb.id);
  }

  const hasRows = !recurringQuery.isLoading && recurring.length > 0;

  return (
    <SettingsSection
      icon={Repeat}
      title="Turnos fijos"
      description="Reservas que se repiten cada semana para un jugador. Bloquean el horario solas, sin pedir seña."
      actions={courts.length > 0 && <CreateRecurringDialog courts={courts} />}
      flush={hasRows}
    >
      {recurringQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando turnos fijos…
        </div>
      ) : recurring.length === 0 ? (
        <SettingsEmpty>
          {courts.length === 0
            ? "Creá una cancha primero para poder cargar turnos fijos."
            : "Todavía no cargaste turnos fijos. Agregá el primero con “Nuevo turno fijo”."}
        </SettingsEmpty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Día y horario</TableHead>
              <TableHead>Cancha</TableHead>
              <TableHead>Jugador</TableHead>
              <TableHead className="hidden md:table-cell">Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {recurring.map((rb) => (
              <TableRow key={rb.id} className={rb.isActive ? "" : "opacity-60"}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{dayLabel(rb.dayOfWeek)}</span>
                    <span className="text-muted-foreground text-xs">
                      {rb.slotStart} – {rb.slotEnd}
                    </span>
                    {rb.untilDate && (
                      <span className="text-muted-foreground text-xs">
                        hasta{" "}
                        {new Date(rb.untilDate).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{rb.court.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{rb.playerName}</span>
                    <span className="text-muted-foreground text-xs">{rb.playerPhone}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {formatPrice(rb.priceCents)}
                </TableCell>
                <TableCell>
                  <Badge variant={rb.isActive ? "default" : "secondary"}>
                    {rb.isActive ? "Activo" : "Pausado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Aplicar a turnos disponibles"
                      title="Aplicar a turnos disponibles"
                      onClick={() => applyRecurring.mutate(rb.id)}
                      disabled={applyRecurring.isPending || !rb.isActive}
                      className="text-muted-foreground hover:text-foreground size-8"
                    >
                      <RefreshCw className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateRecurring.mutate({
                          id: rb.id,
                          body: { isActive: !rb.isActive },
                        })
                      }
                      disabled={updateRecurring.isPending}
                      className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
                    >
                      {rb.isActive ? "Pausar" : "Activar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar turno fijo"
                      onClick={() => void handleDelete(rb)}
                      disabled={deleteRecurring.isPending}
                      className="text-muted-foreground hover:text-destructive size-8"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SettingsSection>
  );
}
