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
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  priceCents: number;
  category?: ProductCategory;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  priceCents?: number;
  category?: ProductCategory;
  isActive?: boolean;
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
