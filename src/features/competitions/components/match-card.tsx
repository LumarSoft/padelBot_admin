"use client";

import { cn } from "@/lib/utils";
import { pairName, scoreLabel } from "@/features/competitions/lib/labels";
import { isBye, isPlayable, type CompetitionIndex } from "@/features/competitions/lib/fixture";
import type { CompetitionMatch } from "@/types/api/competitions";

function Side({
  label,
  winner,
  muted,
}: {
  label: string;
  winner: boolean;
  muted: boolean;
}) {
  return (
    <span className={cn("truncate", winner && "font-semibold", muted && "text-muted-foreground italic")}>{label}</span>
  );
}

/** One match: both pairs (or who they'll be), the score, the court. Tap to load the result. */
export function MatchCard({
  match,
  index,
  onOpen,
  disabled,
}: {
  match: CompetitionMatch;
  index: CompetitionIndex;
  onOpen: (match: CompetitionMatch) => void;
  /** The event can't take results (finished or cancelled). */
  disabled?: boolean;
}) {
  const pairA = match.pairAId ? index.pairsById.get(match.pairAId) : undefined;
  const pairB = match.pairBId ? index.pairsById.get(match.pairBId) : undefined;
  const labelA = pairA ? pairName(pairA) : (match.placeholderA ?? "A definir");
  const labelB = pairB ? pairName(pairB) : (match.placeholderB ?? "A definir");
  const court = match.courtId ? index.courtNameById.get(match.courtId) : undefined;
  const playable = isPlayable(match) && !disabled;

  return (
    <button
      type="button"
      onClick={() => playable && onOpen(match)}
      disabled={!playable}
      className={cn(
        "bg-card/60 flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
        playable && "hover:border-brand/50 hover:bg-card cursor-pointer",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Side label={labelA} winner={!!match.winnerPairId && match.winnerPairId === match.pairAId} muted={!pairA} />
        <Side label={labelB} winner={!!match.winnerPairId && match.winnerPairId === match.pairBId} muted={!pairB} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {isBye(match) ? (
          <span className="text-muted-foreground text-xs">Pasa directo</span>
        ) : match.sets ? (
          <span className="font-mono text-sm tabular-nums">{scoreLabel(match.sets)}</span>
        ) : (
          playable && <span className="text-brand text-xs font-medium">Cargar resultado</span>
        )}
        {court && <span className="text-muted-foreground text-xs">{court}</span>}
      </div>
    </button>
  );
}
