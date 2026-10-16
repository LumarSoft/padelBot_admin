export type ProductCategory = "PELOTA" | "BEBIDA" | "SNACK" | "ACCESORIO" | "OTRO";

/** The order categories are listed in everywhere (catalog, stock, point of sale). */
export const CATEGORY_ORDER: ProductCategory[] = [
  "PELOTA",
  "BEBIDA",
  "SNACK",
  "ACCESORIO",
  "OTRO",
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  PELOTA: "Pelotas",
  BEBIDA: "Bebidas",
  SNACK: "Snacks",
  ACCESORIO: "Accesorios",
  OTRO: "Otros",
};

export interface Product {
  id: string;
  name: string;
  priceCents: number;
  category: ProductCategory;
  isActive: boolean;
  /** What the counter's barcode scanner reads. Unique per club; null = picked by hand. */
  barcode: string | null;
  /** Units on hand. Null = the club doesn't track stock for this product. May be negative. */
  stockQuantity: number | null;
  /** "Para comprar" at this many units or fewer. Null = only when it runs out. */
  lowStockThreshold: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  priceCents: number;
  category?: ProductCategory;
  isActive?: boolean;
  barcode?: string | null;
  /** Starts tracking stock with this many units. Omit to not track it. */
  stockQuantity?: number;
  lowStockThreshold?: number | null;
}

export interface UpdateProductRequest {
  name?: string;
  priceCents?: number;
  category?: ProductCategory;
  isActive?: boolean;
  /** Null removes the code. */
  barcode?: string | null;
  /** Corrected units on hand (logged as an adjustment). Null stops tracking stock. */
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
}

export interface BookingProductItem {
  productId: string;
  quantity: number;
  /** Positions (1..4) of the players sharing this consumo line. [1,2,3,4] = split among all four. */
  players: number[];
}

export interface SetBookingProductsRequest {
  items: BookingProductItem[];
}
