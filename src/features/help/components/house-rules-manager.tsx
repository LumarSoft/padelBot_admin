"use client";

import { useState } from "react";
import { BookMarked, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SaveBar } from "@/features/configuracion/components/save-bar";
import { SettingsSection } from "@/features/configuracion/components/settings-section";
import { useHouseRules, useUpdateHouseRules } from "@/features/help/hooks/use-help";
import type { HouseRule } from "@/types/api/help";

interface Row {
  id: string;
  question: string;
  answer: string;
}

const MAX_ENTRIES = 40;
const QUESTION_MAX = 160;
/** The help shows answers of three lines at most — this keeps the owner's in that range. */
const ANSWER_MAX = 400;

/** What every club ends up telling each new receptionist by word of mouth. */
const SUGGESTIONS = [
  "¿Quién abre y quién cierra?",
  "¿Se le fía a alguien?",
  "¿Dónde queda la llave de la caja?",
  "¿Cuánto sale alquilar una paleta?",
  "¿A quién llamo si hay un problema?",
  "¿Qué hago si se corta la luz?",
];

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function clean(rows: Row[]): HouseRule[] {
  return rows
    .map((r) => ({ question: r.question.trim(), answer: r.answer.trim() }))
    .filter((r) => r.question && r.answer);
}

function HouseRulesEditor({ initial }: { initial: HouseRule[] }) {
  const update = useUpdateHouseRules();
  const [rows, setRows] = useState<Row[]>(() => initial.map((r) => ({ id: newId(), ...r })));

  const cleaned = clean(rows);
  const unchanged = JSON.stringify(cleaned) === JSON.stringify(initial);
  const remaining = SUGGESTIONS.filter(
    (s) => !rows.some((r) => r.question.trim().toLowerCase() === s.toLowerCase()),
  );

  function addRow(question = ""): void {
    if (rows.length >= MAX_ENTRIES) return;
    setRows((prev) => [...prev, { id: newId(), question, answer: "" }]);
  }

  function updateRow(id: string, field: "question" | "answer", value: string): void {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        icon={BookMarked}
        title="Reglas de la casa"
        description="Lo que le explicarías a cada recepcionista nueva. Aparece en la ayuda «?» del panel, junto a las respuestas de GTP. El bot no lo ve."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => addRow()}
            disabled={rows.length >= MAX_ENTRIES || update.isPending}
          >
            <Plus className="size-4" />
            Agregar regla
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          {remaining.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                Ideas (tocá para agregar):
              </span>
              {remaining.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addRow(s)}
                  disabled={rows.length >= MAX_ENTRIES}
                  className="border-border/70 hover:border-brand/50 hover:bg-brand/[0.07] text-foreground/80 hover:text-foreground ease-fluid rounded-full border px-3 py-1 text-xs transition-colors duration-200 disabled:opacity-50"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <p className="text-muted-foreground border-border/70 rounded-xl border border-dashed p-6 text-center text-sm">
              Todavía no cargaste reglas. Agregá una desde las ideas o con «Agregar regla».
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="border-border/70 hover:border-border ease-fluid grid gap-3 rounded-xl border p-3 transition-colors duration-200 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`rule-q-${row.id}`} className="text-muted-foreground text-xs">
                      Pregunta {index + 1}
                    </Label>
                    <Input
                      id={`rule-q-${row.id}`}
                      value={row.question}
                      onChange={(e) => updateRow(row.id, "question", e.target.value)}
                      maxLength={QUESTION_MAX}
                      placeholder="Ej: ¿Se le fía a alguien?"
                      disabled={update.isPending}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`rule-a-${row.id}`} className="text-muted-foreground text-xs">
                      Respuesta (corta)
                    </Label>
                    <Textarea
                      id={`rule-a-${row.id}`}
                      value={row.answer}
                      onChange={(e) => updateRow(row.id, "answer", e.target.value)}
                      rows={2}
                      maxLength={ANSWER_MAX}
                      placeholder="Ej: No. Si no pueden pagar, avisame."
                      disabled={update.isPending}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                    aria-label={`Eliminar la regla ${index + 1}`}
                    className="text-muted-foreground hover:text-destructive size-8 self-start justify-self-end md:mt-6"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingsSection>

      <SaveBar
        pending={update.isPending}
        unchanged={unchanged}
        onSave={() => !unchanged && update.mutate({ entries: cleaned })}
        note={`Tenés cambios sin guardar · ${cleaned.length} ${cleaned.length === 1 ? "regla" : "reglas"} para guardar.`}
      />
    </div>
  );
}

/** Owner editor for the club's own help answers (Configuración → Equipo). */
export function HouseRulesManager() {
  const rulesQuery = useHouseRules();

  if (rulesQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando las reglas de la casa…
      </div>
    );
  }

  const rules = rulesQuery.data ?? [];
  // Re-mount on server data change so local edits reset cleanly to the saved list.
  return <HouseRulesEditor key={JSON.stringify(rules)} initial={rules} />;
}
