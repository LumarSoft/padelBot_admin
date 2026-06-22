const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dayFormat = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

const timeFormat = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

const currencyExact = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Cents → localized currency string (e.g. 1200000 → "$12.000"). */
export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

/** Cents → currency string keeping the two centavos digits (e.g. 250047 → "$2.500,47"). */
export function formatPriceExact(cents: number): string {
  return currencyExact.format(cents / 100);
}

/** ISO date → "mié 25 jun". */
export function formatDay(iso: string): string {
  return dayFormat.format(new Date(iso));
}

/** ISO date → "18:00". */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** Start/end ISO → "18:00 – 19:30". */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}
