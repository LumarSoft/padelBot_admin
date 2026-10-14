import type { ProductCategory } from "@/types/api/products";
import type { PlayerPaymentMethod } from "@/types/api/bookings";

/** A product as the stock screens see it — no price. */
export interface StockProduct {
  id: string;
  name: string;
  category: ProductCategory;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
}

export type StockMovementType = "PURCHASE" | "SALE" | "ADJUSTMENT";

export interface StockMovement {
  id: string;
  type: StockMovementType;
  /** Signed: +N came in, -N went out. */
  quantity: number;
  /** Stock right after this movement (the "queda" column). */
  stockAfter: number;
  note: string | null;
  createdAt: string;
  counterSaleId: string | null;
  user: { id: number; name: string } | null;
  booking: {
    id: string;
    playerName: string;
    slot: { startsAt: string; court: { name: string } };
  } | null;
}

export interface ProductMovements {
  product: StockProduct;
  movements: StockMovement[];
}

export interface StockQuantityItem {
  productId: string;
  quantity: number;
}

export interface RegisterPurchaseRequest {
  items: StockQuantityItem[];
  note?: string;
}

export interface RegisterCountRequest {
  items: { productId: string; countedQuantity: number }[];
  note?: string;
}

export interface CountResult {
  productId: string;
  name: string;
  /** What the system expected. Null = the product wasn't tracked until this count. */
  previousQuantity: number | null;
  countedQuantity: number;
  /** counted − expected: negative = faltante. Null when tracking just started. */
  difference: number | null;
}

export interface CounterSale {
  id: string;
  quantity: number;
  unitPriceCents: number;
  method: PlayerPaymentMethod;
  createdAt: string;
  product: { id: string; name: string; category: ProductCategory };
  user: { id: number; name: string } | null;
}

export interface CreateCounterSaleRequest {
  items: StockQuantityItem[];
  method: PlayerPaymentMethod;
}

export interface CounterSalesDay {
  dateKey: string;
  sales: CounterSale[];
  totalCents: number;
  byMethod: Record<PlayerPaymentMethod, number>;
}

/** True when a tracked product is at or below its minimum (0 when none is set). */
export function isLowStock(product: {
  stockQuantity: number | null;
  lowStockThreshold: number | null;
}): boolean {
  return (
    product.stockQuantity !== null &&
    product.stockQuantity <= (product.lowStockThreshold ?? 0)
  );
}
