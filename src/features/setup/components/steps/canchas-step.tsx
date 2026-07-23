"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StepLayout } from "@/features/setup/components/step-layout";
import { StepFooter } from "@/features/setup/components/step-footer";
import { BotPreview, type PreviewBubble } from "@/features/setup/components/bot-preview";
import { WeeklyHoursEditor } from "@/features/configuracion/components/weekly-hours-editor";
import {
  useCourts,
  useCreateCourt,
  useDeleteCourt,
  useUpdateCourt,
} from "@/features/turnos/hooks/use-courts";
import type { StepProps } from "@/features/setup/components/setup-wizard";
import type { Court, CourtType, WeeklyHours } from "@/types/api/turnos";

const DURATIONS = [60, 90, 120] as const;

function durationLabel(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;
}

/** The shape of a court, as the form holds it before it's saved. */
interface CourtDraft {
  price: string;
  openTime: string;
  closeTime: string;
  duration: string;
  courtType: CourtType;
  weeklyHours: WeeklyHours;
}

const DEFAULT_DRAFT: CourtDraft = {
  price: "20000",
  openTime: "09:00",
  closeTime: "00:00",
  duration: "90",
  courtType: "INDOOR",
  weeklyHours: {},
};

function DraftFields({
  draft,
  onChange,
  disabled,
}: {
  draft: CourtDraft;
  onChange: (next: CourtDraft) => void;
  disabled: boolean;
}) {
  function set<K extends keyof CourtDraft>(key: K, value: CourtDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-court-price">Precio del turno (ARS)</Label>
          <Input
            id="setup-court-price"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            value={draft.price}
            onChange={(e) => set("price", e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Duración del turno</Label>
          <Select
            value={draft.duration}
            onValueChange={(v) => set("duration", (v as string) ?? "90")}
          >
            <SelectTrigger disabled={disabled}>
              <SelectValue>{(v) => durationLabel(Number(v))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((minutes) => (
                <SelectItem key={minutes} value={String(minutes)}>
                  {durationLabel(minutes)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">90 min es el estándar de pádel.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-court-open">Abre</Label>
          <Input
            id="setup-court-open"
            type="time"
            value={draft.openTime}
            onChange={(e) => set("openTime", e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-court-close">Cierra</Label>
          <Input
            id="setup-court-close"
            type="time"
            value={draft.closeTime}
            onChange={(e) => set("closeTime", e.target.value)}
            disabled={disabled}
          />
          <p className="text-muted-foreground text-xs">
            00:00 = medianoche · menor a la apertura = cierra al día siguiente.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tipo</Label>
        <div className="flex gap-2">
          {(
            [
              { value: "INDOOR", label: "Interior" },
              { value: "OUTDOOR", label: "Exterior" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => set("courtType", option.value)}
              disabled={disabled}
              className={cn(
                "ease-fluid flex-1 rounded-lg border px-3 py-2 text-sm transition-all duration-200",
                draft.courtType === option.value
                  ? "border-brand bg-brand/10 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:bg-card",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <WeeklyHoursEditor
        value={draft.weeklyHours}
        onChange={(next) => set("weeklyHours", next)}
        defaultOpen={draft.openTime}
        defaultClose={draft.closeTime}
        disabled={disabled}
      />
    </>
  );
}

export function CanchasStep({ clubName, nav }: StepProps) {
  const courtsQuery = useCourts();
  const createCourt = useCreateCourt();
  const updateCourt = useUpdateCourt();
  const deleteCourt = useDeleteCourt();

  const courts = courtsQuery.data ?? [];
  const hasCourts = courts.length > 0;

  // Most complexes have N identical courts, so the empty state asks "how many?" and
  // creates them in one shot instead of making the owner fill the same form four times.
  const [count, setCount] = useState("2");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState<CourtDraft>(DEFAULT_DRAFT);
  const [adding, setAdding] = useState(false);
  // A court being edited in place; null when adding or idle.
  const [editingId, setEditingId] = useState<string | null>(null);

  const priceNumber = Number(draft.price);
  const priceValid = Number.isFinite(priceNumber) && priceNumber >= 0;
  const priceCents = Math.round(priceNumber * 100);
  const countNumber = Number(count);
  const countValid = Number.isInteger(countNumber) && countNumber >= 1 && countNumber <= 20;

  const isEditing = editingId !== null;
  const isBulk = !hasCourts && !adding && !isEditing;
  const busy = createCourt.isPending || updateCourt.isPending;

  function startEditing(court: Court) {
    setAdding(false);
    setEditingId(court.id);
    setName(court.name);
    setDraft({
      price: String(Math.round(court.priceCents / 100)),
      openTime: court.openTime,
      closeTime: court.closeTime,
      duration: String(court.slotDurationMinutes),
      courtType: court.courtType,
      weeklyHours: court.weeklyHours ?? {},
    });
  }

  function resetForm() {
    setAdding(false);
    setEditingId(null);
    setName("");
    setDraft(DEFAULT_DRAFT);
  }

  function draftBody(courtName: string) {
    return {
      name: courtName,
      priceCents,
      openTime: draft.openTime,
      closeTime: draft.closeTime,
      slotDurationMinutes: Number(draft.duration),
      courtType: draft.courtType,
      ...(Object.keys(draft.weeklyHours).length > 0
        ? { weeklyHours: draft.weeklyHours }
        : {}),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!priceValid) return;

    if (isBulk) {
      if (!countValid) return;
      // Sequential on purpose: the API assigns each court its own row and we want a clean
      // error if one fails, not a half-applied burst.
      for (let i = 1; i <= countNumber; i++) {
        await createCourt.mutateAsync(draftBody(`Cancha ${i}`));
      }
      toast.success(
        `${countNumber} cancha${countNumber === 1 ? "" : "s"} lista${countNumber === 1 ? "" : "s"}`,
      );
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) return;

    if (isEditing && editingId) {
      await updateCourt.mutateAsync({
        id: editingId,
        body: {
          name: trimmed,
          priceCents,
          openTime: draft.openTime,
          closeTime: draft.closeTime,
          slotDurationMinutes: Number(draft.duration),
          courtType: draft.courtType,
          // {} means "no per-day overrides" — send null so the API clears any it had.
          weeklyHours:
            Object.keys(draft.weeklyHours).length > 0 ? draft.weeklyHours : null,
        },
      });
      resetForm();
      return;
    }

    await createCourt.mutateAsync(draftBody(trimmed));
    resetForm();
  }

  const bubbles: PreviewBubble[] = [
    { from: "player", text: "Tenés cancha hoy a la noche?" },
    {
      from: "bot",
      text: hasCourts
        ? `Sí! Para hoy me queda:\n\n• 21:00 — ${courts[0].name} (${formatPrice(courts[0].priceCents)})\n${courts[1] ? `• 22:30 — ${courts[1].name} (${formatPrice(courts[1].priceCents)})\n` : ""}\n¿Cuál te reservo?`
        : "Todavía no tengo canchas cargadas, así que no puedo ofrecerte ningún turno.",
    },
  ];

  return (
    <StepLayout
      id="canchas"
      preview={
        <BotPreview
          clubName={clubName}
          bubbles={bubbles}
          caption={
            hasCourts
              ? "Los turnos que ofrece el bot salen de estas canchas, sus precios y horarios."
              : "Sin canchas cargadas el bot no puede ofrecer ni un turno."
          }
        />
      }
      footer={
        <StepFooter
          nav={nav}
          skipLabel={hasCourts ? "Omitir por ahora" : "Cargar después"}
          primary={
            hasCourts ? (
              <Button type="button" variant="brand" size="lg" onClick={nav.onNext}>
                Continuar
              </Button>
            ) : (
              <Button
                type="submit"
                form="setup-canchas"
                variant="brand"
                size="lg"
                disabled={busy || !priceValid || !countValid}
              >
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creando…
                  </>
                ) : (
                  `Crear ${countValid ? countNumber : ""} cancha${countNumber === 1 ? "" : "s"}`
                )}
              </Button>
            )
          }
        />
      }
    >
      {courtsQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando canchas…
        </div>
      ) : (
        <>
          {hasCourts && (
            <div className="flex flex-col gap-2">
              {courts.map((court) => (
                <Card
                  key={court.id}
                  size="sm"
                  className={cn(
                    "animate-fade-up",
                    editingId === court.id && "ring-brand/50 ring-1",
                  )}
                >
                  <CardContent className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{court.name}</p>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {formatPrice(court.priceCents)} · {court.openTime}–{court.closeTime}{" "}
                        · turnos de {durationLabel(court.slotDurationMinutes)} ·{" "}
                        {court.courtType === "INDOOR" ? "interior" : "exterior"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${court.name}`}
                      onClick={() => startEditing(court)}
                      disabled={busy || deleteCourt.isPending}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar ${court.name}`}
                      onClick={() => deleteCourt.mutate(court.id)}
                      disabled={busy || deleteCourt.isPending}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {hasCourts && !adding && !isEditing ? (
            <div>
              <Button type="button" variant="outline" size="lg" onClick={() => setAdding(true)}>
                <Plus />
                Agregar otra cancha
              </Button>
              <p className="text-muted-foreground mt-2 text-xs">
                Tocá el lápiz para editar una cancha. Los precios por franja horaria (pico,
                promo) se cargan después, desde Configuración → Canchas.
              </p>
            </div>
          ) : (
            <form id="setup-canchas" onSubmit={handleSubmit} className="flex flex-col gap-5">
              {isBulk ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="setup-court-count">¿Cuántas canchas tenés?</Label>
                  <Input
                    id="setup-court-count"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    disabled={busy}
                    className="max-w-24"
                    autoFocus
                  />
                  <p className="text-muted-foreground text-xs">
                    Las creamos como “Cancha 1”, “Cancha 2”… con estos mismos datos. Después
                    las renombrás o les cambiás el precio una por una.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="setup-court-name">Nombre de la cancha</Label>
                  <Input
                    id="setup-court-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="Cancha 3 / Blindex / Fútbol 5"
                    disabled={busy}
                    autoFocus
                  />
                </div>
              )}

              <DraftFields draft={draft} onChange={setDraft} disabled={busy} />

              {hasCourts && (
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="brand"
                    disabled={busy || !priceValid || !name.trim()}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {isEditing ? "Guardando…" : "Creando…"}
                      </>
                    ) : isEditing ? (
                      "Guardar cambios"
                    ) : (
                      "Agregar cancha"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    disabled={busy}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          )}
        </>
      )}
    </StepLayout>
  );
}
