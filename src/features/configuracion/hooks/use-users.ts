"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { usersService } from "@/services/users.service";
import type { CreateUserRequest, UpdateUserRequest } from "@/types/api/users";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: usersService.list,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserRequest) => usersService.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      // Keep the setup wizard's equipo count in sync.
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateUserRequest }) =>
      usersService.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (id: number) => usersService.resetPassword(id),
    onError: (error: Error) => toast.error(error.message),
  });
}
