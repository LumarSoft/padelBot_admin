"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productsService } from "@/services/products.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/types/api/products";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: queryKeys.products.list,
    queryFn: () => productsService.list(),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, CreateProductRequest>({
    mutationFn: (body) => productsService.create(body),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      // Keep the setup wizard's kiosco count in sync.
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
      toast.success(`Producto "${product.name}" creado`);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, { id: string; body: UpdateProductRequest }>({
    mutationFn: ({ id, body }) => productsService.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Producto actualizado");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => productsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
      toast.success("Producto eliminado");
    },
    onError: (error) => toast.error(error.message),
  });
}
