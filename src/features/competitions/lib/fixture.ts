import type { CompetitionDetail, CompetitionMatch, CompetitionPair } from "@/types/api/competitions";

/** Lookups the fixture views need, built once per render of the event. */
export interface CompetitionIndex {
  pairsById: Map<string, CompetitionPair>;
  courtNameById: Map<string, string>;
}

export function indexCompetition(competition: CompetitionDetail): CompetitionIndex {
  return {
    pairsById: new Map(competition.pairs.map((p) => [p.id, p])),
    courtNameById: new Map(competition.courts.map((c) => [c.id, c.name])),
  };
}

/** Matches grouped by round, rounds ascending. */
export function byRound(matches: CompetitionMatch[]): [number, CompetitionMatch[]][] {
  const rounds = new Map<number, CompetitionMatch[]>();
  for (const m of matches) rounds.set(m.round, [...(rounds.get(m.round) ?? []), m]);
  return [...rounds.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, list]) => [round, list.sort((x, y) => x.position - y.position)]);
}

/** A knockout bye: only one pair and already decided without sets. */
export function isBye(match: CompetitionMatch): boolean {
  return match.stage === "KNOCKOUT" && !!match.winnerPairId && !match.sets && (!match.pairAId || !match.pairBId);
}

/** A match that can take a result now: both pairs known, not a bye. */
export function isPlayable(match: CompetitionMatch): boolean {
  return !!match.pairAId && !!match.pairBId && !isBye(match);
}
