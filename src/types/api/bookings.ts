import type { SlotStatus } from "@/types/api/turnos";
import type { ProductCategory } from "@/types/api/products";

export type BookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";

export interface BookingProductEntry {
  id: string;
  quantity: number;
  unitPriceCents: number;
  /** Positions (1..4) of the players sharing this consumo line. [1,2,3,4] = split among all four. */
  players: number[];
  product: { id: string; name: string; category: ProductCategory };
}

export interface BookingSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  status: SlotStatus;
  court: { id: string; name: string };
}

export interface Booking {
  id: string;
  slotId: string;
  clubId: string;
  playerName: string;
  playerPhone: string | null;
  /** DNI captured at booking for payer validation (digits), or null. */
  playerDni: string | null;
  /** CUIT/identification of who actually transferred (from MercadoPago), or null. */
  payerCuit: string | null;
  /** Email of who actually transferred, or null. */
  payerEmail: string | null;
  status: BookingStatus;
  notes: string | null;
  /** CRM link (Player id), set automatically when the booking carries a phone. */
  playerId: string | null;
  /** When the admin marked this booking as a no-show, or null. */
  noShowAt: string | null;
  /** Player credit (cents) consumed at creation to reduce the required transfer. */
  creditAppliedCents: number;
  /** Where the paid deposit went when the booking was cancelled, or null. */
  depositOutcome: "CREDITED" | "FORFEITED" | "REFUNDED" | null;
  /** Money collected at the front desk for this booking (cents). */
  localPaymentCents: number;
  /** "CASH" | "QR" — how the front-desk amount was collected, or null. */
  localPaymentMethod: "CASH" | "QR" | null;
  recurringBookingId: string | null;
  bookedByUserId: number | null;
  /** Deposit owed (cents) — court price split across the 4 players. */
  depositCents: number;
  /** Exact amount (cents, with centavos) the player must transfer to confirm. Null for admin-created bookings. */
  transferAmountCents: number | null;
  /** When the pending transfer window expires (ISO). Null for admin-created bookings. */
  paymentExpiresAt: string | null;
  /** MercadoPago movement id that confirmed this booking (auto or assigned), or null. */
  mpPaymentId: string | null;
  /** When the turno's bill was fully settled (todos pagaron), or null. */
  settledAt: string | null;
  /** When the player sent a transfer receipt photo (RECEIPT mode). Null until one arrives. */
  receiptUploadedAt: string | null;
  /** True when at least one receipt image is attached (RECEIPT mode → review it). */
  hasReceipt: boolean;
  /** Products consumed during this court session. */
  bookingProducts: BookingProductEntry[];
  createdAt: string;
  updatedAt: string;
  slot: BookingSlot;
}

export interface BookingFilters {
  from?: string;
  to?: string;
  courtId?: string;
  status?: BookingStatus;
  playerPhone?: string;
  /** Global search: matches player name or phone (contains). */
  search?: string;
}

export interface CreateBookingRequest {
  slotId: string;
  playerName: string;
  playerPhone?: string;
  notes?: string;
}

export interface RescheduleBookingRequest {
  newSlotId: string;
}

export type PlayerPaymentMethod = "CASH" | "QR" | "TRANSFER";

export interface PlayerPaymentLine {
  id: string;
  playerSlot: number;
  amountCents: number;
  method: PlayerPaymentMethod;
  createdAt: string;
}

export interface PlayerAccount {
  /** Position 1..4 (J1 = quien reservó). */
  slot: number;
  owesCents: number;
  paidCents: number;
  remainingCents: number;
  /** Only J1: the paid deposit credited to them. */
  depositCreditedCents: number;
}

/** The turno's bill (mirrors the API's BookingAccountView). */
export interface BookingAccountView {
  courtPriceCents: number;
  consumosTotalCents: number;
  totalCents: number;
  depositPaidCents: number;
  unassignedPaidCents: number;
  paidCents: number;
  remainingCents: number;
  settledAt: string | null;
  players: [PlayerAccount, PlayerAccount, PlayerAccount, PlayerAccount];
  payments: PlayerPaymentLine[];
}

export interface AddPlayerPaymentRequest {
  playerSlot: number;
  amountCents: number;
  method: PlayerPaymentMethod;
}
