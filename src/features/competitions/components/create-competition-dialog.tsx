"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayKey } from "@/features/agenda/lib/schedule";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { useCreateCompetition } from "@/features/competitions/hooks/use-competitions";
import { CourtToggles } from "@/features/competitions/components/court-toggles";
import { SessionRows } from "@/features/competitions/components/session-rows";
import { CategoryRows } from "@/features/competitions/components/category-rows";
import { KIND_LABEL, MATCH_FORMAT_LABEL, pesosToCents } from "@/features/competitions/lib/labels";
import type { CategoryInput, CompetitionKind, MatchFormat, SessionInput } from "@/types/api/competitions";

const MATCH_FORMATS: MatchFormat[] = ["ONE_SET", "BEST_OF_THREE"];

function initialSessions(kind: CompetitionKind): SessionInput[] {
  return [{ dateKey: todayKey(), startTime: kind === "PENA" ? "20:00" : "09:00", endTime: "23:00" }];
}

/** New torneo or peña. Creating it blocks its courts in the agenda right away. */
export function CreateCompetitionDialog({ kind }: { kind: CompetitionKind }) {
  const router = useRouter();
  const courts = useCourts().data ?? [];
  const create = useCreateCompetition();
  const isPena = kind === "PENA";
  const label = KIND_LABEL[kind];

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("ONE_SET");
  const [courtIds, setCourtIds] = useState<string[]>([]);
  const [sessions, setSessions] = useState<SessionInput[]>(() => initialSessions(kind));
  const [categories, setCategories] = useState<CategoryInput[]>([{ name: "", format: "GROUPS_KNOCKOUT" }]);

  const sessionsValid = sessions.every((s) => s.dateKey && s.startTime && s.endTime && s.startTime !== s.endTime);
  const categoriesValid = isPena || categories.every((c) => c.name.trim().length > 0);
  const canSubmit =
    name.trim().length >= 2 && courtIds.length > 0 && sessionsValid && categoriesValid && !create.isPending;

  function reset() {
    setName("");
    setFee("");
    setMatchFormat("ONE_SET");
    setCourtIds([]);
    setSessions(initialSessions(kind));
    setCategories([{ name: "", format: "GROUPS_KNOCKOUT" }]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      {
        kind,
        name: name.trim(),
        matchFormat: isPena ? "ONE_SET" : matchFormat,
        entryFeeCents: pesosToCents(fee),
        courtIds,
        sessions,
        ...(isPena ? {} : { categories: categories.map((c) => ({ ...c, name: c.name.trim() })) }),
      },
      {
        onSuccess: (created) => {
          reset();
          setOpen(false);
          router.push(`${label.path}/${created.id}`);
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
      <DialogTrigger render={<Button variant="brand" data-help={isPena ? "penas-nueva" : "torneos-nueva"} />}>
        <Plus className="size-4" />
        {isPena ? "Nueva peña" : "Nuevo torneo"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isPena ? "Nueva peña" : "Nuevo torneo"}</DialogTitle>
          <DialogDescription>
            {isPena
              ? "Elegí las canchas y el horario. Esos turnos quedan bloqueados en la agenda; después anotás las parejas y armás los partidos."
              : "Las canchas quedan bloqueadas en la agenda los días y horarios del torneo. Después anotás las parejas de cada categoría."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_9rem] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="competition-name">Nombre</Label>
              <Input
                id="competition-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isPena ? "Peña de los jueves" : "Torneo Primavera"}
                maxLength={120}
                disabled={create.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="competition-fee">Inscripción</Label>
              <Input
                id="competition-fee"
                type="number"
                inputMode="numeric"
                min={0}
                step={500}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="$ por jugador"
                disabled={create.isPending}
              />
            </div>
          </div>

          {!isPena && (
            <div className="flex flex-col gap-2">
              <Label>Formato de los partidos</Label>
              <Select value={matchFormat} onValueChange={(v) => setMatchFormat((v ?? "ONE_SET") as MatchFormat)}>
                <SelectTrigger>
                  <SelectValue>{(v) => MATCH_FORMAT_LABEL[v as MatchFormat] ?? ""}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MATCH_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {MATCH_FORMAT_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>{isPena ? "Día y horario" : "Días y horarios"}</Label>
            <SessionRows value={sessions} onChange={setSessions} single={isPena} disabled={create.isPending} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Canchas</Label>
            {courts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Creá una cancha primero.</p>
            ) : (
              <CourtToggles courts={courts} value={courtIds} onChange={setCourtIds} disabled={create.isPending} />
            )}
          </div>

          {!isPena && (
            <div className="flex flex-col gap-2">
              <Label>Categorías</Label>
              <CategoryRows value={categories} onChange={setCategories} disabled={create.isPending} />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {create.isPending ? "Creando…" : isPena ? "Crear peña" : "Crear torneo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
