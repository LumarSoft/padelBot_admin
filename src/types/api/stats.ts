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

export interface OccupancyCell {
  /** 0 = Sunday … 6 = Saturday (club-local). */
  weekday: number;
  bandStart: string;
  offered: number;
  occupied: number;
}

export interface OccupancyReport {
  weeks: number;
  fromDateKey: string;
  toDateKey: string;
  bandStarts: string[];
  cells: OccupancyCell[];
}

export interface RevenueDay {
  dateKey: string;
  depositCents: number;
  productsCents: number;
  /** Front-desk cash collected (modo mostrador). */
  cashCents: number;
  /** Front-desk QR collected. */
  qrCents: number;
  bookings: number;
}

export interface RevenueReport {
  fromDateKey: string;
  toDateKey: string;
  totalDepositCents: number;
  totalProductsCents: number;
  totalCashCents: number;
  totalQrCents: number;
  totalBookings: number;
  days: RevenueDay[];
}
