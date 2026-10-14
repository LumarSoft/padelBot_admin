const count = new Intl.NumberFormat("es-AR");

/** 8000 → "8.000". */
export function formatCount(value: number): string {
  return count.format(value);
}

/** "2026-10" → "octubre". */
export function monthName(month: string): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString("es-AR", { month: "long" });
}
