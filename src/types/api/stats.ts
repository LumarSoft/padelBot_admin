export interface StatsSeriesPoint {
  /** "YYYY-MM-DD" (club timezone). */
  date: string;
  count: number;
}

export interface OverviewStats {
  /** Confirmed bookings whose slot is today. */
  turnosHoy: number;
  /** Confirmed bookings still in the future. */
  reservasActivas: number;
  /** Conversations with activity in the last 24h. */
  chatsActivos: number;
  /** Pending-payment bookings whose link hasn't expired. */
  pendientesPago: number;
  /** Deposits collected from confirmed bookings in the window (cents). */
  ingresosCents: number;
  /** Confirmed bookings the bot/player created (last 14 days). */
  reservasBot: number;
  /** Confirmed bookings staff created from the panel (last 14 days). */
  reservasPanel: number;
  /** Per-day count of non-cancelled bookings created over the last 14 days. */
  series: StatsSeriesPoint[];
}
