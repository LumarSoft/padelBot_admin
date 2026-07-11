"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { playersService } from "@/services/players.service";
import type { UpdatePlayerRequest } from "@/types/api/players";

export function usePlayers(search: string) {
  return useQuery({
    queryKey: queryKeys.players.list(search),
    queryFn: () => playersService.list(search || undefined),
  });
}

export function usePlayerDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.players.detail(id ?? ""),
    queryFn: () => playersService.get(id!),
    enabled: !!id,
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePlayerRequest }) =>
      playersService.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
