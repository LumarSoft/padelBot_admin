/** A consumo line that contributes to the turno's bill. */
export interface AccountLine {
  unitPriceCents: number;
  quantity: number;
  /** Positions (1..4) of the players sharing this line's cost. */
  players: number[];
}

/** Per-player total (cents), indexed 0..3 for Jugador 1..4. */
export type PerPlayerCents = [number, number, number, number];

export interface BookingAccount {
  perPlayerCents: PerPlayerCents;
  /** Court price ÷ 4, indexed 0..3 for Jugador 1..4. */
  courtSharesCents: PerPlayerCents;
  consumosTotalCents: number;
  totalCents: number;
}

/**
 * Splits `totalCents` into `n` non-negative integers that sum back to `totalCents` exactly —
 * the leftover centavos go to the first positions. Avoids floats per the project's money rule.
 */
export function splitEqually(totalCents: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * Computes what each of the 4 fixed players owes: court price ÷ 4, plus each player's equal
 * share of every consumo line they're part of. The court is always split 4 ways even if the
 * line-up has fewer than 4 players — see SPLIT-ACCOUNT-PLAN.md §8.
 */
export function computeBookingAccount(
  courtPriceCents: number,
  lines: AccountLine[],
): BookingAccount {
  const courtSharesCents = splitEqually(courtPriceCents, 4) as PerPlayerCents;
  const perPlayerCents = [...courtSharesCents] as PerPlayerCents;

  let consumosTotalCents = 0;
  for (const line of lines) {
    const lineTotalCents = line.unitPriceCents * line.quantity;
    consumosTotalCents += lineTotalCents;
    if (line.players.length === 0) continue;
    const shares = splitEqually(lineTotalCents, line.players.length);
    line.players.forEach((player, i) => {
      perPlayerCents[player - 1] += shares[i];
    });
  }

  return {
    perPlayerCents,
    courtSharesCents,
    consumosTotalCents,
    totalCents: courtPriceCents + consumosTotalCents,
  };
}
