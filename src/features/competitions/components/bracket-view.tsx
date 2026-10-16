"use client";

import { MatchCard } from "@/features/competitions/components/match-card";
import { byRound, type CompetitionIndex } from "@/features/competitions/lib/fixture";
import { roundName } from "@/features/competitions/lib/labels";
import type { CompetitionMatch } from "@/types/api/competitions";

/** The knockout bracket, one column per round from the first to the final. */
export function BracketView({
  matches,
  index,
  onOpen,
  disabled,
}: {
  matches: CompetitionMatch[];
  index: CompetitionIndex;
  onOpen: (match: CompetitionMatch) => void;
  disabled?: boolean;
}) {
  const rounds = byRound(matches);
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {rounds.map(([round, list]) => (
          <div key={round} className="flex w-64 flex-col gap-2">
            <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {roundName(round, rounds.length)}
            </h4>
            <div className="flex flex-1 flex-col justify-around gap-2">
              {list.map((m) => (
                <MatchCard key={m.id} match={m} index={index} onOpen={onOpen} disabled={disabled} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
