"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stockService } from "@/services/stock.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
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

/** Everything a stock change can make stale: the catalog's numbers and the stock views. */
function useInvalidateStock() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
  };
}

export function useShoppingList() {
  return useQuery<StockProduct[]>({
    queryKey: queryKeys.stock.shoppingList,
    queryFn: () => stockService.shoppingList(),
  });
}

export function useProductMovements(productId: string | null) {
  return useQuery<ProductMovements>({
    queryKey: queryKeys.stock.movements(productId ?? ""),
    queryFn: () => stockService.movements(productId!),
    enabled: productId !== null,
  });
}

export function useCounterSales(dateKey: string) {
  return useQuery<CounterSalesDay>({
    queryKey: queryKeys.stock.counterSales(dateKey),
    queryFn: () => stockService.counterSales(dateKey),
  });
}

/** "Cargar stock" in the point of sale; the screen itself confirms what came in. */
export function useRegisterPurchase() {
  const invalidate = useInvalidateStock();
  return useMutation<StockProduct[], ApiError, RegisterPurchaseRequest>({
    mutationFn: (body) => stockService.registerPurchase(body),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(error.message),
  });
}

export function useRegisterCount() {
  const invalidate = useInvalidateStock();
  return useMutation<CountResult[], ApiError, RegisterCountRequest>({
    mutationFn: (body) => stockService.registerCount(body),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(error.message),
  });
}

/** "Cobrar" in the point of sale; the screen itself confirms the sale (and offers to undo it). */
export function useCreateCounterSale() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateStock();
  return useMutation<CounterSale[], ApiError, CreateCounterSaleRequest>({
    mutationFn: (body) => stockService.createCounterSale(body),
    onSuccess: () => {
      invalidate();
      // It counts in the day's cash.
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** Undoes a whole ticket just charged (one counter sale per product): back to stock, out of the cash. */
export function useUndoCounterSales() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateStock();
  return useMutation<void, ApiError, string[]>({
    mutationFn: async (ids) => {
      for (const id of ids) await stockService.removeCounterSale(id);
    },
    onSuccess: () => toast.success("Venta anulada"),
    onError: (error) => toast.error(error.message),
    // Even a half-undone ticket changed the stock and the cash.
    onSettled: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useRemoveCounterSale() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateStock();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => stockService.removeCounterSale(id),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Venta anulada");
    },
    onError: (error) => toast.error(error.message),
  });
}
