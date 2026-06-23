"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clubsService } from "@/services/clubs.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/api-error";
import type {
  ClubProfile,
  MercadoPagoStatus,
  TransferConfig,
  UpdateClubProfileRequest,
  UpdateTransferConfigRequest,
} from "@/types/api/clubs";

export function useClubProfile() {
  return useQuery<ClubProfile>({
    queryKey: queryKeys.clubs.profile,
    queryFn: () => clubsService.getProfile(),
  });
}

export function useUpdateClubProfile() {
  const queryClient = useQueryClient();

  return useMutation<ClubProfile, ApiError, UpdateClubProfileRequest>({
    mutationFn: (body) => clubsService.updateProfile(body),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.clubs.profile, profile);
      toast.success("Datos del complejo actualizados");
    },
    onError: (error) => toast.error(error.message),
  });
}

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

export function useMercadoPagoStatus() {
  return useQuery<MercadoPagoStatus>({
    queryKey: queryKeys.clubs.mercadopago,
    queryFn: () => clubsService.getMercadoPagoStatus(),
  });
}

export function useConnectMercadoPago() {
  return useMutation<{ url: string }, ApiError, void>({
    mutationFn: () => clubsService.connectMercadoPago(),
    // Redirect the owner's browser to MercadoPago to authorize.
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDisconnectMercadoPago() {
  const queryClient = useQueryClient();

  return useMutation<{ disconnected: true }, ApiError, void>({
    mutationFn: () => clubsService.disconnectMercadoPago(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.mercadopago });
      toast.success("MercadoPago desconectado");
    },
    onError: (error) => toast.error(error.message),
  });
}
