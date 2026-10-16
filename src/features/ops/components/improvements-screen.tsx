"use client";

import { useState } from "react";
import { Lightbulb, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/features/improvements/components/status-pill";
import { IMPROVEMENT_STATUS, formatDate } from "@/features/improvements/lib/labels";
import { ImprovementForm } from "@/features/ops/components/improvement-form";
import { SuggestionInboxItem } from "@/features/ops/components/suggestion-inbox-item";
import {
  useCreateImprovement,
  useDeleteImprovement,
  useOpsImprovements,
  useOpsImprovementSuggestions,
  useUpdateImprovement,
} from "@/features/ops/hooks/use-ops";
import type { OpsImprovement } from "@/types/api/improvements";

type Filter = "OPEN" | "ALL";

/** Suggestions waiting on us: not answered with a final status yet. */
const OPEN_STATUSES = new Set(["NEW", "UNDER_REVIEW", "PLANNED"]);

function SuggestionsInbox({ improvements }: { improvements: OpsImprovement[] }) {
  const suggestions = useOpsImprovementSuggestions();
  const [filter, setFilter] = useState<Filter>("OPEN");

  const rows = (suggestions.data ?? []).filter(
    (s) => filter === "ALL" || OPEN_STATUSES.has(s.status),
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Propuestas de los clubes</h2>
        <div className="flex gap-1">
          {(["OPEN", "ALL"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                filter === value
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "OPEN" ? "Pendientes" : "Todas"}
            </button>
          ))}
        </div>
      </div>
      {suggestions.isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Lightbulb className="size-4" />
          {filter === "OPEN" ? "No hay propuestas pendientes." : "Todavía no llegaron propuestas."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((suggestion) => (
            <SuggestionInboxItem
              key={`${suggestion.id}-${suggestion.opsReply ?? ""}`}
              suggestion={suggestion}
              improvements={improvements}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ImprovementItem({ improvement }: { improvement: OpsImprovement }) {
  const update = useUpdateImprovement();
  const remove = useDeleteImprovement();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const status = IMPROVEMENT_STATUS[improvement.status];
  const published = improvement.publishedAt !== null;

  async function handleDelete(): Promise<void> {
    const ok = await confirm({
      title: "¿Eliminar esta mejora?",
      description: "Los clubes dejan de verla. Las propuestas vinculadas quedan, sin el vínculo.",
      confirmLabel: "Eliminar",
      tone: "destructive",
    });
    if (ok) remove.mutate(improvement.id);
  }

  if (editing) {
    return (
      <li className="border-border/70 rounded-xl border p-4">
        <ImprovementForm
          initial={improvement}
          published={published}
          pending={update.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(payload) =>
            update.mutate({ id: improvement.id, payload }, { onSuccess: () => setEditing(false) })
          }
        />
      </li>
    );
  }

  return (
    <li className="border-border/70 flex flex-col gap-2 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label={status.label} tone={status.tone} />
        <span className="text-muted-foreground text-xs">
          {published ? `Publicada el ${formatDate(improvement.publishedAt!)}` : "Borrador"}
          {improvement.suggestionCount > 0 &&
            ` · ${improvement.suggestionCount} ${improvement.suggestionCount === 1 ? "propuesta" : "propuestas"}`}
        </span>
        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              update.mutate({ id: improvement.id, payload: { published: !published } })
            }
            disabled={update.isPending}
          >
            {published ? "Despublicar" : "Publicar"}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Editar"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Eliminar"
            onClick={() => void handleDelete()}
            disabled={remove.isPending}
            className="hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <p className="font-medium">{improvement.title}</p>
      <p className="text-muted-foreground text-sm whitespace-pre-line">{improvement.body}</p>
    </li>
  );
}

/** `/ops/mejoras`: the clubs' suggestions inbox and the improvements we post for every club. */
export function ImprovementsScreen() {
  const improvements = useOpsImprovements();
  const create = useCreateImprovement();
  // Remounts the form after a successful create, so it comes back empty.
  const [formKey, setFormKey] = useState(0);
  const rows = improvements.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mejoras"
        description="Lo que nos proponen los clubes y lo que publicamos en «Mejoras» del panel y la app."
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SuggestionsInbox improvements={rows} />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Publicar una mejora</h2>
          <Card>
            <CardContent>
              <ImprovementForm
                key={formKey}
                pending={create.isPending}
                onSubmit={(payload) =>
                  create.mutate(payload, { onSuccess: () => setFormKey((k) => k + 1) })
                }
              />
            </CardContent>
          </Card>
          {improvements.isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando…</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {rows.map((improvement) => (
                <ImprovementItem key={improvement.id} improvement={improvement} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
