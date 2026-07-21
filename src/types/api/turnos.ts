export type SlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export type CourtType = "INDOOR" | "OUTDOOR";

/** Opening hours for one day. `close` ≤ `open` means the court closes past midnight. */
export interface DayHours {
  open: string;
  close: string;
}

/**
 * Per-weekday overrides keyed "0" (Sunday) … "6" (Saturday). A missing key falls
 * back to openTime/closeTime; an explicit null closes that day.
 */
export type WeeklyHours = Partial<
  Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", DayHours | null>
>;

export interface Court {
  id: string;
  name: string;
  priceCents: number;
  openTime: string;
  closeTime: string;
  /** Band length in minutes (60/90/120…). */
  slotDurationMinutes: number;
  weeklyHours: WeeklyHours | null;
  courtType: CourtType;
  /** Per-band price exceptions over `priceCents` — resolve a band's price with them. */
  priceRules: { dayOfWeek: number | null; startTime: string; priceCents: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface Slot {
  id: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  status: SlotStatus;
  court: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourtRequest {
  name: string;
  priceCents: number;
  openTime?: string;
  closeTime?: string;
  slotDurationMinutes?: number;
  weeklyHours?: WeeklyHours;
  courtType?: CourtType;
}

export interface UpdateCourtRequest {
  name?: string;
  priceCents?: number;
  openTime?: string;
  closeTime?: string;
  slotDurationMinutes?: number;
  /** null clears every per-weekday override. */
  weeklyHours?: WeeklyHours | null;
  courtType?: CourtType;
}

export interface PriceRule {
  id: string;
  courtId: string;
  /** 0 = Sunday … 6 = Saturday, or null for every day. */
  dayOfWeek: number | null;
  /** "HH:MM" band start the price applies to. */
  startTime: string;
  priceCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriceRuleRequest {
  startTime: string;
  priceCents: number;
  dayOfWeek?: number | null;
}

export interface UpdatePriceRuleRequest {
  priceCents: number;
}

export interface CreateSlotRequest {
  courtId: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  status?: SlotStatus;
}

export interface UpdateSlotRequest {
  priceCents?: number;
  status?: SlotStatus;
}

export interface SlotFilters {
  courtId?: string;
  status?: SlotStatus;
  from?: string;
  to?: string;
}

export interface BulkBlockSlotsRequest {
  courtIds: string[];
  fromDate: string; // "YYYY-MM-DD"
  toDate: string; // "YYYY-MM-DD"
  slotStarts?: string[]; // omit = whole day
}

export interface BulkBlockResult {
  blocked: number;
  created: number;
  skipped: number;
}

export interface BulkUnblockResult {
  unblocked: number;
}

export interface BulkPriceAdjustRequest {
  /** Percentage change, e.g. 10 = +10%, -5 = -5%. */
  percent: number;
  dryRun?: boolean;
  /** Future "YYYY-MM-DD" schedules the change instead of applying it now. */
  effectiveDate?: string;
}

export interface BulkPriceAdjustResult {
  applied: boolean;
  /** True when a future effectiveDate stored the change for later. */
  scheduled?: boolean;
  effectiveDateKey?: string;
  percent: number;
  courts: { id: string; name: string; beforeCents: number; afterCents: number }[];
  priceRulesUpdated: number;
}

export interface ScheduledPriceAdjustment {
  id: string;
  percent: number;
  effectiveDateKey: string;
  createdAt: string;
}
