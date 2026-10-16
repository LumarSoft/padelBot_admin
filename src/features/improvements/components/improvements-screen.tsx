"use client";

import { Lightbulb, Loader2, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/features/improvements/components/status-pill";
import { SuggestionForm } from "@/features/improvements/components/suggestion-form";
import {
  useImprovementSuggestions,
  usePublishedImprovements,
} from "@/features/improvements/hooks/use-improvements";
import {
  IMPROVEMENT_STATUS,
  SUGGESTION_STATUS,
  formatDate,
} from "@/features/improvements/lib/labels";

function Loading() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
      <Loader2 className="size-4 animate-spin" />
      Cargando…
    </div>
  );
}

/** What Lumarsoft shipped or is building, newest first. */
function PublishedList() {
  const improvements = usePublishedImprovements();

  if (improvements.isLoading) return <Loading />;
  const rows = improvements.data ?? [];
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Rocket}
        title="Pronto vas a ver acá las mejoras"
        description="Cada vez que sumemos algo a GTP lo vas a encontrar en esta lista."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {rows.map((improvement) => {
        const status = IMPROVEMENT_STATUS[improvement.status];
        return (
          <li key={improvement.id}>
            <Card>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={status.label} tone={status.tone} />
                  <span className="text-muted-foreground text-xs">
                    {formatDate(improvement.publishedAt)}
                  </span>
                </div>
                <h3 className="text-base font-medium">{improvement.title}</h3>
                <p className="text-muted-foreground text-sm whitespace-pre-line">
                  {improvement.body}
                </p>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}

/** The club's suggestions and what we answered. */
function SuggestionList() {
  const suggestions = useImprovementSuggestions();

  if (suggestions.isLoading) return <Loading />;
  const rows = suggestions.data ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground border-border/70 rounded-xl border border-dashed p-6 text-center text-sm">
        Todavía no nos mandaron propuestas. La primera puede ser la tuya.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((suggestion) => {
        const status = SUGGESTION_STATUS[suggestion.status];
        return (
          <li key={suggestion.id} className="border-border/70 flex flex-col gap-2 rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{suggestion.title}</p>
              <StatusPill label={status.label} tone={status.tone} />
            </div>
            <p className="text-muted-foreground text-sm whitespace-pre-line">{suggestion.body}</p>
            <p className="text-muted-foreground text-xs">
              {suggestion.authorName ? `${suggestion.authorName} · ` : ""}
              {formatDate(suggestion.createdAt)}
            </p>
            {suggestion.opsReply && (
              <div className="bg-brand/[0.06] border-brand/20 rounded-lg border p-2.5 text-sm">
                <p className="text-brand mb-0.5 text-xs font-medium">Respuesta de GTP</p>
                <p className="whitespace-pre-line">{suggestion.opsReply}</p>
              </div>
            )}
            {suggestion.improvement && (
              <p className="text-xs">
                <span className="text-muted-foreground">Mejora relacionada: </span>
                <span className="font-medium">{suggestion.improvement.title}</span>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** "Mejoras": GTP's changelog plus the club's own suggestions to us. Owner and staff. */
export function ImprovementsScreen() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Lo nuevo en GTP</h2>
        <PublishedList />
      </section>

      <section className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="text-brand size-4" />
              <h2 className="text-sm font-medium">Proponé una mejora</h2>
            </div>
            <p className="text-muted-foreground -mt-2 text-xs">
              Le llega directo al equipo de GTP. Te respondemos acá mismo.
            </p>
            <SuggestionForm />
          </CardContent>
        </Card>
        <h2 className="text-sm font-medium">Propuestas de tu club</h2>
        <SuggestionList />
      </section>
    </div>
  );
}
