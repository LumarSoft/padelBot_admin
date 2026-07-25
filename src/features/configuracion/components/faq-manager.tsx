"use client";

import { useState } from "react";
import { Bot, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SaveBar } from "@/features/configuracion/components/save-bar";
import { SettingsSection } from "@/features/configuracion/components/settings-section";
import { useFaq, useUpdateFaq } from "@/features/configuracion/hooks/use-transfer-config";
import type { FaqEntry } from "@/types/api/clubs";

/** Local row: a FAQ entry plus a stable id for React keys while editing. */
interface Row {
  id: string;
  question: string;
  answer: string;
}

const MAX_ENTRIES = 40;
const QUESTION_MAX = 160;
const ANSWER_MAX = 600;

/** Common questions a padel club gets — one tap seeds an empty answer to fill in. */
const SUGGESTIONS = [
  "¿Alquilan paletas?",
  "¿Venden pelotas?",
  "¿Hay estacionamiento?",
  "¿Tienen vestuarios y duchas?",
  "¿Puedo pagar en efectivo?",
  "¿Tienen buffet o kiosco?",
  "¿Dan clases con profe?",
  "¿Qué pasa si llueve?",
];

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function toRows(entries: FaqEntry[]): Row[] {
  return entries.map((e) => ({ id: newId(), question: e.question, answer: e.answer }));
}

/** The cleaned, ready-to-save list (trimmed, blanks dropped) — matches the API's own cleaning. */
function clean(rows: Row[]): FaqEntry[] {
  return rows
    .map((r) => ({ question: r.question.trim(), answer: r.answer.trim() }))
    .filter((r) => r.question && r.answer);
}

function FaqEditor({ initial }: { initial: FaqEntry[] }) {
  const updateFaq = useUpdateFaq();
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));

  const cleaned = clean(rows);
  const unchanged = JSON.stringify(cleaned) === JSON.stringify(initial);
  const hasHalfFilled = rows.some(
    (r) => (r.question.trim() && !r.answer.trim()) || (!r.question.trim() && r.answer.trim()),
  );

  function addRow(question = ""): void {
    if (rows.length >= MAX_ENTRIES) return;
    setRows((prev) => [...prev, { id: newId(), question, answer: "" }]);
  }

  function addSuggestion(question: string): void {
    const exists = rows.some((r) => r.question.trim().toLowerCase() === question.toLowerCase());
    if (exists) return;
    addRow(question);
  }

  function updateRow(id: string, field: "question" | "answer", value: string): void {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function removeRow(id: string): void {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleSave(): void {
    if (unchanged || updateFaq.isPending) return;
    updateFaq.mutate({ entries: cleaned });
  }

  const remaining = SUGGESTIONS.filter(
    (s) => !rows.some((r) => r.question.trim().toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        icon={Bot}
        title="Preguntas del bot"
        description={
          <>
            Lo que el bot responde sobre el complejo: servicios, formas de pago, reglas, alquileres
            y todo lo que te suelen preguntar. Usa{" "}
            <span className="text-foreground font-medium">solo esto</span> — si algo no está
            cargado, dice con sinceridad que no lo tiene, nunca lo inventa.
          </>
        }
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => addRow()}
            disabled={rows.length >= MAX_ENTRIES || updateFaq.isPending}
          >
            <Plus className="size-4" />
            Agregar pregunta
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          {remaining.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                Sugerencias (tocá para agregar):
              </span>
              {remaining.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSuggestion(s)}
                  disabled={rows.length >= MAX_ENTRIES}
                  className="border-border/70 hover:border-brand/50 hover:bg-brand/[0.07] text-foreground/80 hover:text-foreground rounded-full border px-3 py-1 text-xs transition-colors duration-200 ease-fluid disabled:opacity-50"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <p className="text-muted-foreground border-border/70 rounded-xl border border-dashed p-6 text-center text-sm">
              Todavía no cargaste preguntas. Agregá una desde las sugerencias o con “Agregar
              pregunta”.
            </p>
          ) : (
            // Question left, answer right: the answer is the long field, and stacking both
            // full-width left a 72rem row holding a two-line textarea.
            <div className="flex flex-col gap-3">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="border-border/70 hover:border-border grid gap-3 rounded-xl border p-3 transition-colors duration-200 ease-fluid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`faq-q-${row.id}`} className="text-muted-foreground text-xs">
                      Pregunta {index + 1}
                    </Label>
                    <Input
                      id={`faq-q-${row.id}`}
                      value={row.question}
                      onChange={(e) => updateRow(row.id, "question", e.target.value)}
                      maxLength={QUESTION_MAX}
                      placeholder="Ej: ¿Alquilan paletas?"
                      disabled={updateFaq.isPending}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`faq-a-${row.id}`} className="text-muted-foreground text-xs">
                      Respuesta del bot
                    </Label>
                    <Textarea
                      id={`faq-a-${row.id}`}
                      value={row.answer}
                      onChange={(e) => updateRow(row.id, "answer", e.target.value)}
                      rows={2}
                      maxLength={ANSWER_MAX}
                      placeholder="Ej: Sí, alquilamos paletas a $2000 la hora en el mostrador."
                      disabled={updateFaq.isPending}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Eliminar la pregunta ${index + 1}`}
                    className="text-muted-foreground hover:text-destructive size-8 self-start justify-self-end md:mt-6"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {(hasHalfFilled || rows.length >= MAX_ENTRIES) && (
            <p className="text-muted-foreground text-xs">
              {hasHalfFilled && "Las filas sin pregunta o sin respuesta no se guardan. "}
              {rows.length >= MAX_ENTRIES && `Llegaste al máximo de ${MAX_ENTRIES} preguntas.`}
            </p>
          )}
        </div>
      </SettingsSection>

      <SaveBar
        pending={updateFaq.isPending}
        unchanged={unchanged}
        onSave={handleSave}
        note={`Tenés cambios sin guardar · ${cleaned.length} ${cleaned.length === 1 ? "pregunta" : "preguntas"} para guardar.`}
      />
    </div>
  );
}

export function FaqManager() {
  const faqQuery = useFaq();

  if (faqQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando las preguntas del bot…
      </div>
    );
  }

  const entries = faqQuery.data ?? [];
  // Re-mount on server data change so local edits reset cleanly to the saved list.
  return <FaqEditor key={JSON.stringify(entries)} initial={entries} />;
}
