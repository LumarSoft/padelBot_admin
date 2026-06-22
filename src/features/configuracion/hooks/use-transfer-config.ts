"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clubsService } from "@/services/clubs.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type { TransferConfig, UpdateTransferConfigRequest } from "@/types/api/clubs";

export function useTransferConfig() {
  return useQuery<TransferConfig>({
    queryKey: queryKeys.clubs.transferConfig,
    queryFn: () => clubsService.getTransferConfig(),
  });
}

export function useUpdateTransferConfig() {
  const queryClient = useQueryClient();

  return useMutation<TransferConfig, ApiError, UpdateTransferConfigRequest>({
    mutationFn: (body) => clubsService.updateTransferConfig(body),
    onSuccess: (config) => {
      queryClient.setQueryData(queryKeys.clubs.transferConfig, config);
      toast.success("Datos de cobro actualizados");
    },
    onError: (error) => toast.error(error.message),
  });
}
