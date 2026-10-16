"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, LayoutGrid, Loader2, Users, Wallet } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { useCompetition } from "@/features/competitions/hooks/use-competitions";
import { AddPairDialog } from "@/features/competitions/components/add-pair-dialog";
import { CategoryFixture } from "@/features/competitions/components/category-fixture";
import { CompetitionActions } from "@/features/competitions/components/competition-actions";
import { CompetitionStatusBadge } from "@/features/competitions/components/competition-status-badge";
import { PairsTable } from "@/features/competitions/components/pairs-table";
import {
  CATEGORY_FORMAT_LABEL,
  KIND_LABEL,
  MATCH_FORMAT_LABEL,
  sessionLabel,
} from "@/features/competitions/lib/labels";
import type { CompetitionKind } from "@/types/api/competitions";

/** One torneo or peña: who's in, who paid, and the matches. */
export function CompetitionDetailScreen({ id, kind }: { id: string; kind: CompetitionKind }) {
  const query = useCompetition(id);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const label = KIND_LABEL[kind];

  if (query.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    );
  }

  const competition = query.data;
  if (!competition || competition.kind !== kind) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title={`No encontramos ${kind === "PENA" ? "esa peña" : "ese torneo"}`}
        action={
          <Link href={label.path} className="text-brand text-sm font-medium">
            Volver a {label.many}
          </Link>
        }
      />
    );
  }

  const isPena = kind === "PENA";
  const locked = competition.status === "FINISHED" || competition.status === "CANCELLED";
  const category = competition.categories.find((c) => c.id === categoryId) ?? competition.categories[0];
  const categoryPairs = category ? competition.pairs.filter((p) => p.categoryId === category.id) : [];
  const openCategories = competition.categories.filter((c) => !c.fixtureGeneratedAt);

  return (
    <div className="stagger-children flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link href={label.path} className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm">
          <ArrowLeft className="size-4" />
          {label.many}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{competition.name}</h1>
              <CompetitionStatusBadge status={competition.status} />
            </div>
            <div className="text-muted-foreground flex flex-col gap-1 text-sm">
              {competition.sessions.map((s) => (
                <span key={s.id} className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {sessionLabel(s)}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="size-3.5" />
                {competition.courts.map((c) => c.name).join(", ")}
                {!isPena && ` · ${MATCH_FORMAT_LABEL[competition.matchFormat]}`}
              </span>
              {competition.entryFeeCents > 0 && (
                <span className="flex items-center gap-1.5">
                  <Wallet className="size-3.5" />
                  {formatPrice(competition.entryFeeCents)} por jugador · cobrado {formatPrice(competition.fees.collectedCents)} de{" "}
                  {formatPrice(competition.fees.expectedCents)}
                </span>
              )}
            </div>
          </div>
          <CompetitionActions competition={competition} />
        </div>
      </div>

      {competition.categories.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorías">
          {competition.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === category?.id}
              onClick={() => setCategoryId(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                c.id === category?.id ? "border-brand bg-brand/10 font-medium" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c.name}
              <span className="text-muted-foreground ml-1.5 text-xs">
                {competition.pairs.filter((p) => p.categoryId === c.id).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {category && (
        <Tabs defaultValue="pairs" key={category.id}>
          <TabsList>
            <TabsIndicator />
            <TabsTab value="pairs">
              <Users className="size-4" />
              {isPena ? "Parejas" : "Inscriptos"}
            </TabsTab>
            <TabsTab value="matches">Partidos</TabsTab>
          </TabsList>

          <TabsPanel value="pairs" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                {categoryPairs.length} {categoryPairs.length === 1 ? "pareja anotada" : "parejas anotadas"}
                {category.maxPairs ? ` de ${category.maxPairs}` : ""}
                {!isPena && ` · ${CATEGORY_FORMAT_LABEL[category.format]}`}
              </p>
              {!locked && (
                <AddPairDialog
                  competitionId={competition.id}
                  categories={openCategories}
                  defaultCategoryId={category.fixtureGeneratedAt ? undefined : category.id}
                />
              )}
            </div>
            {categoryPairs.length === 0 ? (
              <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                Todavía no hay parejas anotadas{competition.categories.length > 1 ? " en esta categoría" : ""}.
              </div>
            ) : (
              <PairsTable
                competitionId={competition.id}
                pairs={categoryPairs}
                showPayments={competition.entryFeeCents > 0}
                canRemove={!category.fixtureGeneratedAt && !locked}
              />
            )}
          </TabsPanel>

          <TabsPanel value="matches">
            <CategoryFixture competition={competition} category={category} />
          </TabsPanel>
        </Tabs>
      )}
    </div>
  );
}
