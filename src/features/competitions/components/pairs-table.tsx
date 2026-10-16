"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useRemovePair, useSetPlayerPayment } from "@/features/competitions/hooks/use-competitions";
import { PAYMENT_METHOD_LABEL, pairName } from "@/features/competitions/lib/labels";
import type { CompetitionPair, CompetitionPlayer, PaymentMethod } from "@/types/api/competitions";

const PENDING = "PENDING";
const PAYMENT_OPTIONS: (PaymentMethod | typeof PENDING)[] = [PENDING, "CASH", "QR", "TRANSFER"];

function paymentLabel(value: string): string {
  return value === PENDING ? "Debe" : `Pagó · ${PAYMENT_METHOD_LABEL[value as PaymentMethod]}`;
}

function PaymentSelect({ competitionId, player }: { competitionId: string; player: CompetitionPlayer }) {
  const setPayment = useSetPlayerPayment(competitionId);
  const value = player.paidAt ? (player.paymentMethod ?? "CASH") : PENDING;

  return (
    <Select
      value={value}
      disabled={setPayment.isPending}
      onValueChange={(next) => {
        if (!next || next === value) return;
        setPayment.mutate({
          playerId: player.id,
          body: next === PENDING ? { paid: false } : { paid: true, method: next as PaymentMethod },
        });
      }}
    >
      <SelectTrigger
        size="sm"
        className={cn("w-44", value === PENDING ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300")}
      >
        <SelectValue>{(v) => paymentLabel(String(v))}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PAYMENT_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {paymentLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** The registered pairs of a category, with each player's fee. */
export function PairsTable({
  competitionId,
  pairs,
  showPayments,
  canRemove,
}: {
  competitionId: string;
  pairs: CompetitionPair[];
  /** Only when the event charges a fee. */
  showPayments: boolean;
  /** Pairs can only be removed before the category's fixture. */
  canRemove: boolean;
}) {
  const removePair = useRemovePair(competitionId);
  const confirm = useConfirm();

  async function handleRemove(pair: CompetitionPair) {
    const ok = await confirm({
      title: `¿Sacar a ${pairName(pair)}?`,
      description: "La pareja deja de estar anotada.",
      confirmLabel: "Sacar pareja",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) removePair.mutate(pair.id);
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Jugadores</TableHead>
            {showPayments && <TableHead>Inscripción</TableHead>}
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair, index) => (
            <TableRow key={pair.id}>
              <TableCell className="text-muted-foreground align-top">
                {pair.seed ? <span title="Cabeza de serie">{pair.seed}°</span> : index + 1}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {pair.players.map((player) => (
                    <div key={player.id} className="flex items-baseline gap-2">
                      <span className="font-medium">{player.name}</span>
                      {player.phone && <span className="text-muted-foreground text-xs">{player.phone}</span>}
                    </div>
                  ))}
                </div>
              </TableCell>
              {showPayments && (
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {pair.players.map((player) => (
                      <PaymentSelect key={player.id} competitionId={competitionId} player={player} />
                    ))}
                  </div>
                </TableCell>
              )}
              <TableCell className="align-top">
                {canRemove && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Sacar a ${pairName(pair)}`}
                    onClick={() => handleRemove(pair)}
                    disabled={removePair.isPending}
                  >
                    <Trash2 />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
