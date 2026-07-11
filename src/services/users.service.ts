import { apiClient } from "@/lib/api/client";
import type {
  ChangePasswordRequest,
  ClubUser,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
} from "@/types/api/users";

export const usersService = {
  list(): Promise<ClubUser[]> {
    return apiClient.get<ClubUser[]>("/api/users");
  },
  create(body: CreateUserRequest): Promise<CreateUserResponse> {
    return apiClient.post<CreateUserResponse>("/api/users", body);
  },
  update(id: number, body: UpdateUserRequest): Promise<ClubUser> {
    return apiClient.patch<ClubUser>(`/api/users/${id}`, body);
  },
  resetPassword(id: number): Promise<{ tempPassword: string }> {
    return apiClient.post<{ tempPassword: string }>(`/api/users/${id}/reset-password`);
  },
  changePassword(body: ChangePasswordRequest): Promise<{ changed: boolean }> {
    return apiClient.post<{ changed: boolean }>("/api/users/me/change-password", body);
  },
};
