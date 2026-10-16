"use client";

import { useState } from "react";
import { Shuffle, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  useDeleteBracket,
  useDeleteFixture,
  useGenerateBracket,
  useGenerateFixture,
} from "@/features/competitions/hooks/use-competitions";
import { BracketView } from "@/features/competitions/components/bracket-view";
import { MatchCard } from "@/features/competitions/components/match-card";
import { MatchResultDialog } from "@/features/competitions/components/match-result-dialog";
import { StandingsTable } from "@/features/competitions/components/standings-table";
import { byRound, indexCompetition } from "@/features/competitions/lib/fixture";
import type { CompetitionCategory, CompetitionDetail, CompetitionMatch } from "@/types/api/competitions";

function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

/**
 * The matches of one category: the round robin by round (peña, or a "todos contra todos"
 * category), the zonas with their tables, and the bracket.
 */
export function CategoryFixture({
  competition,
  category,
}: {
  competition: CompetitionDetail;
  category: CompetitionCategory;
}) {
  const [selected, setSelected] = useState<CompetitionMatch | null>(null);
  const confirm = useConfirm();
  const generateFixture = useGenerateFixture(competition.id);
  const deleteFixture = useDeleteFixture(competition.id);
  const generateBracket = useGenerateBracket(competition.id);
  const deleteBracket = useDeleteBracket(competition.id);

  const index = indexCompetition(competition);
  const locked = competition.status === "FINISHED" || competition.status === "CANCELLED";
  const pairs = competition.pairs.filter((p) => p.categoryId === category.id);
  const matches = competition.matches.filter((m) => m.categoryId === category.id);
  const groupMatches = matches.filter((m) => m.stage === "GROUP");
  const knockout = matches.filter((m) => m.stage === "KNOCKOUT");
  const hasResults = matches.some((m) => m.sets);
  const pendingGroup = groupMatches.filter((m) => !m.winnerPairId).length;
  const isPena = competition.kind === "PENA";

  async function handleDeleteFixture() {
    const ok = await confirm({
      title: "¿Borrar el fixture?",
      description: "Se borran los partidos y las zonas. Las parejas siguen anotadas y podés volver a armarlo.",
      confirmLabel: "Borrar fixture",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) deleteFixture.mutate(category.id);
  }

  if (!category.fixtureGeneratedAt) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
        <p className="text-muted-foreground text-sm">
          {pairs.length < 2
            ? "Anotá al menos 2 parejas para armar los partidos."
            : isPena
              ? `Con ${pairs.length} parejas se juegan ${(pairs.length * (pairs.length - 1)) / 2} partidos, repartidos en las ${competition.courts.length} canchas.`
              : "Cuando estén todas las parejas, armá el fixture. Después ya no se pueden sumar parejas a esta categoría."}
        </p>
        <Button
          variant="brand"
          disabled={pairs.length < 2 || locked || generateFixture.isPending}
          onClick={() => generateFixture.mutate(category.id)}
        >
          <Shuffle className="size-4" />
          {isPena ? "Armar partidos" : category.format === "GROUPS_KNOCKOUT" ? "Armar zonas" : "Armar fixture"}
        </Button>
      </div>
    );
  }

  const fixtureActions = !hasResults && !locked && (
    <Button variant="ghost" size="sm" onClick={handleDeleteFixture} disabled={deleteFixture.isPending}>
      <Trash2 className="size-3.5" />
      Borrar fixture
    </Button>
  );

  return (
    <div className="flex flex-col gap-8">
      {category.format === "ROUND_ROBIN" && (
        <>
          {category.standings && hasResults && (
            <Section title="Tabla">
              <div className="overflow-hidden rounded-xl border">
                <StandingsTable rows={category.standings} index={index} />
              </div>
            </Section>
          )}
          <Section title="Partidos" actions={fixtureActions}>
            <div className="grid gap-4 lg:grid-cols-2">
              {byRound(groupMatches).map(([round, list]) => (
                <div key={round} className="flex flex-col gap-2">
                  <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Ronda {round}</h4>
                  {list.map((m) => (
                    <MatchCard key={m.id} match={m} index={index} onOpen={setSelected} disabled={locked} />
                  ))}
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {category.format === "GROUPS_KNOCKOUT" && (
        <Section title="Zonas" actions={fixtureActions}>
          <div className="grid gap-4 lg:grid-cols-2">
            {category.groups.map((group) => (
              <div key={group.id} className="glass-card flex flex-col gap-3 rounded-xl p-4">
                <h4 className="font-medium">{group.name}</h4>
                <StandingsTable rows={group.standings} index={index} qualify={category.advancePerGroup} />
                <div className="flex flex-col gap-2">
                  {groupMatches
                    .filter((m) => m.groupId === group.id)
                    .map((m) => (
                      <MatchCard key={m.id} match={m} index={index} onOpen={setSelected} disabled={locked || !!category.bracketGeneratedAt} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {category.format !== "ROUND_ROBIN" && (
        <Section
          title="Cuadro"
          actions={
            category.format === "GROUPS_KNOCKOUT" &&
            category.bracketGeneratedAt &&
            !knockout.some((m) => m.sets) &&
            !locked && (
              <Button variant="ghost" size="sm" onClick={() => deleteBracket.mutate(category.id)} disabled={deleteBracket.isPending}>
                <Trash2 className="size-3.5" />
                Borrar cuadro
              </Button>
            )
          }
        >
          {knockout.length > 0 ? (
            <BracketView matches={knockout} index={index} onOpen={setSelected} disabled={locked} />
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
              <p className="text-muted-foreground text-sm">
                {pendingGroup > 0
                  ? `Faltan ${pendingGroup} ${pendingGroup === 1 ? "resultado" : "resultados"} de las zonas para armar el cuadro.`
                  : `Pasan las ${category.advancePerGroup} mejores de cada zona.`}
              </p>
              <Button
                variant="brand"
                disabled={pendingGroup > 0 || locked || generateBracket.isPending}
                onClick={() => generateBracket.mutate(category.id)}
              >
                <Trophy className="size-4" />
                Armar cuadro
              </Button>
            </div>
          )}
        </Section>
      )}

      {selected && (
        <MatchResultDialog
          competitionId={competition.id}
          match={selected}
          format={competition.matchFormat}
          index={index}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
