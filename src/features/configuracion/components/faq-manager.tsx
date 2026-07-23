"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Cargá las preguntas que te suelen hacer y qué tiene que responder el bot. El bot usa
        <strong> solo esto</strong> para las consultas del complejo: si algo no está cargado, dice
        con sinceridad que no lo tiene — nunca lo inventa.
      </p>

      {remaining.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium">Sugerencias (tocá para agregar):</span>
          <div className="flex flex-wrap gap-2">
            {remaining.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSuggestion(s)}
                disabled={rows.length >= MAX_ENTRIES}
                className="border-input hover:bg-accent text-foreground/80 rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-center text-sm">
            Todavía no cargaste preguntas. Agregá una desde las sugerencias o con el botón de abajo.
          </p>
        )}

        {rows.map((row, index) => (
          <div key={row.id} className="flex flex-col gap-2 rounded-xl border p-4">
            <div className="flex items-start justify-between gap-2">
              <Label htmlFor={`faq-q-${row.id}`} className="text-muted-foreground text-xs">
                Pregunta {index + 1}
              </Label>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                aria-label="Eliminar pregunta"
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <Input
              id={`faq-q-${row.id}`}
              value={row.question}
              onChange={(e) => updateRow(row.id, "question", e.target.value)}
              maxLength={QUESTION_MAX}
              placeholder="Ej: ¿Alquilan paletas?"
              disabled={updateFaq.isPending}
            />
            <textarea
              id={`faq-a-${row.id}`}
              value={row.answer}
              onChange={(e) => updateRow(row.id, "answer", e.target.value)}
              rows={2}
              maxLength={ANSWER_MAX}
              placeholder="Respuesta del bot. Ej: Sí, alquilamos paletas a $2000 la hora en el mostrador."
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              disabled={updateFaq.isPending}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => addRow()}
          disabled={rows.length >= MAX_ENTRIES || updateFaq.isPending}
        >
          <Plus className="size-4" />
          Agregar pregunta
        </Button>
        <Button type="button" onClick={handleSave} disabled={unchanged || updateFaq.isPending}>
          {updateFaq.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
        {hasHalfFilled && (
          <span className="text-muted-foreground text-xs">
            Las filas sin pregunta o sin respuesta no se guardan.
          </span>
        )}
        {rows.length >= MAX_ENTRIES && (
          <span className="text-muted-foreground text-xs">Llegaste al máximo de {MAX_ENTRIES} preguntas.</span>
        )}
      </div>
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
