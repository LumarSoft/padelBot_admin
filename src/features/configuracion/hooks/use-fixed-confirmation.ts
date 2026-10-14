"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clubsService } from "@/services/clubs.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  FixedConfirmationConfig,
  UpdateFixedConfirmationRequest,
} from "@/types/api/clubs";

/** The automatic WhatsApp "¿venís?" to the fijos (on/off + how early). Readable by staff. */
export function useFixedConfirmation() {
  return useQuery<FixedConfirmationConfig>({
    queryKey: queryKeys.clubs.fixedConfirmation,
    queryFn: () => clubsService.getFixedConfirmation(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateFixedConfirmation() {
  const queryClient = useQueryClient();

  return useMutation<FixedConfirmationConfig, ApiError, UpdateFixedConfirmationRequest>({
    mutationFn: (body) => clubsService.updateFixedConfirmation(body),
    onSuccess: (config) => {
      queryClient.setQueryData(queryKeys.clubs.fixedConfirmation, config);
      toast.success(
        config.enabled
          ? "Listo: el bot les va a preguntar a los fijos si vienen"
          : "Confirmación automática de fijos apagada",
      );
    },
    onError: (error) => toast.error(error.message),
  });
}
