/**
 * Formats a payer's identification (CUIT 11 digits, or a DNI) as a human DNI with
 * thousands separators, e.g. "20447652839" → "44.765.283". Returns null if unusable.
 */
export function formatDniFromCuit(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  const dni = digits.length === 11 ? digits.slice(2, 10) : digits;
  if (dni.length < 7 || dni.length > 8) return null;
  return new Intl.NumberFormat("es-AR").format(parseInt(dni, 10));
}
