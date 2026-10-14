export type ProductCategory = "PELOTA" | "BEBIDA" | "SNACK" | "ACCESORIO" | "OTRO";

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
  /** Starts tracking stock with this many units. Omit to not track it. */
  stockQuantity?: number;
  lowStockThreshold?: number | null;
}

export interface UpdateProductRequest {
  name?: string;
  priceCents?: number;
  category?: ProductCategory;
  isActive?: boolean;
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
