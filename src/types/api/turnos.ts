export type SlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export type CourtType = "INDOOR" | "OUTDOOR";

export interface Court {
  id: string;
  name: string;
  priceCents: number;
  openTime: string;
  closeTime: string;
  courtType: CourtType;
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
  courtType?: CourtType;
}

export interface UpdateCourtRequest {
  name?: string;
  priceCents?: number;
  openTime?: string;
  closeTime?: string;
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
