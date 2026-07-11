"use client";

import { useState } from "react";
import { Ban, Loader2, Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import { usePlayers } from "@/features/jugadores/hooks/use-players";
import { PlayerDetailDialog } from "@/features/jugadores/components/player-detail-dialog";

export function PlayersScreen() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const playersQuery = usePlayers(search);

  const players = playersQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o teléfono…"
          className="pl-9"
        />
      </div>

      {playersQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando jugadores…
        </div>
      ) : players.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={search ? "Sin resultados" : "Sin jugadores todavía"}
          description={
            search
              ? "Ningún jugador coincide con la búsqueda."
              : "Los jugadores se crean solos con cada reserva que llega con teléfono."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead className="text-right">Reservas</TableHead>
                <TableHead className="text-right">Ausencias</TableHead>
                <TableHead className="text-right">Crédito</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow
                  key={player.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(player.id)}
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{player.name ?? "Sin nombre"}</span>
                      <span className="text-muted-foreground text-xs">{player.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {player.bookingsCount}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    <span className={player.noShowCount >= 3 ? "text-red-600 font-semibold" : ""}>
                      {player.noShowCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {player.creditCents > 0 ? formatPrice(player.creditCents) : "—"}
                  </TableCell>
                  <TableCell>
                    {player.isBlocked ? (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="size-3" />
                        Bloqueado
                      </Badge>
                    ) : player.noShowCount >= 3 ? (
                      <Badge variant="secondary">Seña total</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedId && (
        <PlayerDetailDialog
          playerId={selectedId}
          open={!!selectedId}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}
