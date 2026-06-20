import { apiClient } from "@/lib/api/client";
import type {
  LoginRequest,
  LoginResponse,
  SessionUser,
} from "@/types/api/auth";

/**
 * Auth API calls (browser side). These hit the internal BFF routes, which in
 * turn talk to padelbot_api and manage the session cookie.
 */
export const authService = {
  async login(credentials: LoginRequest): Promise<SessionUser> {
    const { user } = await apiClient.post<LoginResponse>(
      "/api/auth/login",
      credentials,
    );
    return user;
  },

  async logout(): Promise<void> {
    await apiClient.post<void>("/api/auth/logout");
  },

  async getCurrentUser(): Promise<SessionUser> {
    const { user } = await apiClient.get<LoginResponse>("/api/auth/me");
    return user;
  },
};
