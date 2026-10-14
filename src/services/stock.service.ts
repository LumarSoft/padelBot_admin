import { apiClient } from "@/lib/api/client";
import type {
  CounterSale,
  CounterSalesDay,
  CountResult,
  CreateCounterSaleRequest,
  ProductMovements,
  RegisterCountRequest,
  RegisterPurchaseRequest,
  StockProduct,
} from "@/types/api/stock";

export const stockService = {
  registerPurchase(body: RegisterPurchaseRequest): Promise<StockProduct[]> {
    return apiClient.post<StockProduct[]>("/api/stock/purchases", body);
  },
  registerCount(body: RegisterCountRequest): Promise<CountResult[]> {
    return apiClient.post<CountResult[]>("/api/stock/counts", body);
  },
  shoppingList(): Promise<StockProduct[]> {
    return apiClient.get<StockProduct[]>("/api/stock/shopping-list");
  },
  movements(productId: string, limit = 100): Promise<ProductMovements> {
    return apiClient.get<ProductMovements>(
      `/api/stock/products/${productId}/movements?limit=${limit}`,
    );
  },
  createCounterSale(body: CreateCounterSaleRequest): Promise<CounterSale[]> {
    return apiClient.post<CounterSale[]>("/api/stock/counter-sales", body);
  },
  counterSales(dateKey: string): Promise<CounterSalesDay> {
    return apiClient.get<CounterSalesDay>(
      `/api/stock/counter-sales?date=${dateKey}`,
    );
  },
  removeCounterSale(id: string): Promise<void> {
    return apiClient.del<void>(`/api/stock/counter-sales/${id}`);
  },
};
