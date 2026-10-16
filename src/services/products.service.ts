import { apiClient } from "@/lib/api/client";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/types/api/products";
import type { Booking } from "@/types/api/bookings";
import type { SetBookingProductsRequest } from "@/types/api/products";

export const productsService = {
  list(): Promise<Product[]> {
    return apiClient.get<Product[]>("/api/products");
  },
  /** The product a scanned code belongs to; rejects with a 404 ApiError when none has it. */
  findByBarcode(code: string): Promise<Product> {
    return apiClient.get<Product>(
      `/api/products/by-barcode?code=${encodeURIComponent(code)}`,
    );
  },
  create(body: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>("/api/products", body);
  },
  update(id: string, body: UpdateProductRequest): Promise<Product> {
    return apiClient.patch<Product>(`/api/products/${id}`, body);
  },
  remove(id: string): Promise<void> {
    return apiClient.del<void>(`/api/products/${id}`);
  },
  setBookingProducts(bookingId: string, body: SetBookingProductsRequest): Promise<Booking> {
    return apiClient.put<Booking>(`/api/bookings/${bookingId}/products`, body);
  },
};
