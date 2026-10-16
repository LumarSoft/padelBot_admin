"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Loader2, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { useCompetitions } from "@/features/competitions/hooks/use-competitions";
import { CompetitionStatusBadge } from "@/features/competitions/components/competition-status-badge";
import { KIND_LABEL, sessionLabel } from "@/features/competitions/lib/labels";
import type { CompetitionKind, CompetitionSummary } from "@/types/api/competitions";

function isDone(competition: CompetitionSummary): boolean {
  return competition.status === "FINISHED" || competition.status === "CANCELLED";
}

function CompetitionCard({ competition }: { competition: CompetitionSummary }) {
  const first = competition.sessions[0];
  const extraDays = competition.sessions.length - 1;
  return (
    <Link
      href={`${KIND_LABEL[competition.kind].path}/${competition.id}`}
      className="glass-card group flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-card/80"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{competition.name}</span>
          <CompetitionStatusBadge status={competition.status} />
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {first && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {sessionLabel(first)}
              {extraDays > 0 && ` (+${extraDays} ${extraDays === 1 ? "día" : "días"})`}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {competition._count.pairs} {competition._count.pairs === 1 ? "pareja" : "parejas"}
          </span>
          <span>{competition.courts.map((c) => c.name).join(", ")}</span>
          {competition.entryFeeCents > 0 && <Badge variant="outline">{formatPrice(competition.entryFeeCents)} por jugador</Badge>}
        </div>
      </div>
      <ChevronRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** The club's torneos or peñas: the ones still running first, then the finished and cancelled. */
export function CompetitionsScreen({ kind }: { kind: CompetitionKind }) {
  const query = useCompetitions({ kind });
  const competitions = query.data ?? [];
  const active = competitions.filter((c) => !isDone(c));
  const done = competitions.filter(isDone);
  const label = KIND_LABEL[kind];

  if (query.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <EmptyState
        icon={kind === "PENA" ? Users : Trophy}
        title={kind === "PENA" ? "Todavía no armaste ninguna peña" : "Todavía no armaste ningún torneo"}
        description={
          kind === "PENA"
            ? "Elegí canchas y horario, anotá las parejas y el panel arma los partidos de todos contra todos."
            : "Cargá las categorías, anotá las parejas y el panel arma zonas, cuadro y tabla de posiciones."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {active.length > 0 && (
        <section className="flex flex-col gap-2">
          {active.map((c) => (
            <CompetitionCard key={c.id} competition={c} />
          ))}
        </section>
      )}
      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-sm font-medium">
            {label.many} terminad{kind === "PENA" ? "as" : "os"} o cancelad{kind === "PENA" ? "as" : "os"}
          </h2>
          {done.map((c) => (
            <CompetitionCard key={c.id} competition={c} />
          ))}
        </section>
      )}
    </div>
  );
}
