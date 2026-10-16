"use client";

import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddPair } from "@/features/competitions/hooks/use-competitions";
import type { CompetitionCategory } from "@/types/api/competitions";

interface PlayerFields {
  name: string;
  phone: string;
}

const EMPTY: [PlayerFields, PlayerFields] = [
  { name: "", phone: "" },
  { name: "", phone: "" },
];

/** Registers a pair. Phones are optional; with one the player joins the club's Jugadores. */
export function AddPairDialog({
  competitionId,
  categories,
  defaultCategoryId,
}: {
  competitionId: string;
  /** The categories still taking pairs (no fixture yet). */
  categories: CompetitionCategory[];
  defaultCategoryId?: string;
}) {
  const addPair = useAddPair(competitionId);
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<[PlayerFields, PlayerFields]>(EMPTY);
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? "");
  const [seed, setSeed] = useState("");

  const showCategory = categories.length > 1;
  const canSubmit =
    players.every((p) => p.name.trim().length >= 2) && !!categoryId && !addPair.isPending;

  function patch(index: 0 | 1, change: Partial<PlayerFields>) {
    setPlayers((current) => {
      const next: [PlayerFields, PlayerFields] = [{ ...current[0] }, { ...current[1] }];
      next[index] = { ...next[index], ...change };
      return next;
    });
  }

  function reset() {
    setPlayers(EMPTY);
    setSeed("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const seedNumber = Number(seed);
    addPair.mutate(
      {
        categoryId,
        players: [
          { name: players[0].name.trim(), ...(players[0].phone.trim() ? { phone: players[0].phone.trim() } : {}) },
          { name: players[1].name.trim(), ...(players[1].phone.trim() ? { phone: players[1].phone.trim() } : {}) },
        ],
        ...(Number.isInteger(seedNumber) && seedNumber > 0 ? { seed: seedNumber } : {}),
      },
      {
        // Keep the dialog open: the desk usually loads several pairs in a row.
        onSuccess: () => reset(),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" disabled={categories.length === 0} />}>
        <UserPlus className="size-4" />
        Anotar pareja
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Anotar pareja</DialogTitle>
          <DialogDescription>
            El teléfono es opcional. Si lo cargás, el jugador queda guardado en Jugadores.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {showCategory && (
            <div className="flex flex-col gap-2">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue>{(v) => categories.find((c) => c.id === v)?.name ?? ""}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {([0, 1] as const).map((index) => (
            <div key={index} className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`pair-name-${index}`}>Jugador {index + 1}</Label>
                <Input
                  id={`pair-name-${index}`}
                  value={players[index].name}
                  onChange={(e) => patch(index, { name: e.target.value })}
                  placeholder="Nombre y apellido"
                  maxLength={100}
                  autoFocus={index === 0}
                  disabled={addPair.isPending}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`pair-phone-${index}`}>Teléfono</Label>
                <Input
                  id={`pair-phone-${index}`}
                  value={players[index].phone}
                  onChange={(e) => patch(index, { phone: e.target.value })}
                  placeholder="Opcional"
                  inputMode="tel"
                  maxLength={20}
                  disabled={addPair.isPending}
                />
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <Label htmlFor="pair-seed">Cabeza de serie</Label>
            <Input
              id="pair-seed"
              type="number"
              min={1}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Opcional (1 = la mejor)"
              className="w-48"
              disabled={addPair.isPending}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {addPair.isPending ? "Anotando…" : "Anotar y seguir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
