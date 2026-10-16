"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateMatch } from "@/features/competitions/hooks/use-competitions";
import { pairName } from "@/features/competitions/lib/labels";
import type { CompetitionIndex } from "@/features/competitions/lib/fixture";
import type { CompetitionMatch, MatchFormat, SetScore } from "@/types/api/competitions";

type SetFields = [string, string];

function initialSets(match: CompetitionMatch, format: MatchFormat): SetFields[] {
  const rows = format === "ONE_SET" ? 1 : 3;
  return Array.from({ length: rows }, (_, i) => {
    const set = match.sets?.[i];
    return set ? [String(set[0]), String(set[1])] : ["", ""];
  });
}

/** Rows filled with two whole numbers become sets; empty rows (an unplayed third set) are dropped. */
function toSets(fields: SetFields[]): SetScore[] | null {
  const sets: SetScore[] = [];
  for (const [a, b] of fields) {
    if (a === "" && b === "") continue;
    const x = Number(a);
    const y = Number(b);
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) return null;
    sets.push([x, y]);
  }
  return sets.length > 0 ? sets : null;
}

/** Loads the games of each set. The API checks the format and works out the winner. */
export function MatchResultDialog({
  competitionId,
  match,
  format,
  index,
  onClose,
}: {
  competitionId: string;
  match: CompetitionMatch;
  format: MatchFormat;
  index: CompetitionIndex;
  onClose: () => void;
}) {
  const updateMatch = useUpdateMatch(competitionId);
  const [fields, setFields] = useState<SetFields[]>(() => initialSets(match, format));
  const sets = toSets(fields);
  const nameA = pairName(index.pairsById.get(match.pairAId ?? ""));
  const nameB = pairName(index.pairsById.get(match.pairBId ?? ""));

  function patch(row: number, side: 0 | 1, value: string) {
    setFields((current) =>
      current.map((f, i) => (i === row ? ((side === 0 ? [value, f[1]] : [f[0], value]) as SetFields) : f)),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sets) return;
    updateMatch.mutate({ matchId: match.id, body: { sets } }, { onSuccess: onClose });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resultado</DialogTitle>
          <DialogDescription>
            {format === "ONE_SET" ? "Games del set." : "Games de cada set. El tercero solo si quedaron 1 a 1."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
            <span />
            <div className="text-muted-foreground flex gap-2 text-xs">
              {fields.map((_, i) => (
                <span key={i} className="w-14 text-center">
                  {format === "ONE_SET" ? "Games" : `Set ${i + 1}`}
                </span>
              ))}
            </div>
            {([0, 1] as const).map((side) => (
              <div key={side} className="contents">
                <span className="truncate font-medium">{side === 0 ? nameA : nameB}</span>
                <div className="flex gap-2">
                  {fields.map((row, i) => (
                    <Input
                      key={i}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={99}
                      aria-label={`${side === 0 ? nameA : nameB}, ${format === "ONE_SET" ? "games" : `set ${i + 1}`}`}
                      value={row[side]}
                      onChange={(e) => patch(i, side, e.target.value)}
                      className="w-14 text-center"
                      autoFocus={side === 0 && i === 0}
                      disabled={updateMatch.isPending}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="sm:justify-between">
            {match.sets ? (
              <Button
                type="button"
                variant="ghost"
                disabled={updateMatch.isPending}
                onClick={() => updateMatch.mutate({ matchId: match.id, body: { sets: null } }, { onSuccess: onClose })}
              >
                Borrar resultado
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={!sets || updateMatch.isPending}>
              {updateMatch.isPending ? "Guardando…" : "Guardar resultado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
