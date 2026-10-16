import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { pairName } from "@/features/competitions/lib/labels";
import type { CompetitionIndex } from "@/features/competitions/lib/fixture";
import type { StandingRow } from "@/types/api/competitions";

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** Table of a zona or a peña. `qualify` highlights the pairs that go on to the bracket. */
export function StandingsTable({
  rows,
  index,
  qualify = 0,
}: {
  rows: StandingRow[];
  index: CompetitionIndex;
  qualify?: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">#</TableHead>
          <TableHead>Pareja</TableHead>
          <TableHead className="text-right">PJ</TableHead>
          <TableHead className="text-right">PG</TableHead>
          <TableHead className="text-right" title="Diferencia de sets">Sets</TableHead>
          <TableHead className="text-right" title="Diferencia de games">Games</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={row.pairId} className={cn(i < qualify && "bg-emerald-500/[0.06]")}>
            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
            <TableCell className="font-medium">{pairName(index.pairsById.get(row.pairId))}</TableCell>
            <TableCell className="text-right tabular-nums">{row.played}</TableCell>
            <TableCell className="text-right tabular-nums">{row.won}</TableCell>
            <TableCell className="text-right tabular-nums">{signed(row.setsWon - row.setsLost)}</TableCell>
            <TableCell className="text-right tabular-nums">{signed(row.gamesWon - row.gamesLost)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
