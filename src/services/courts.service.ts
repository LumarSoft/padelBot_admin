import { apiClient } from "@/lib/api/client";
import type { Court, CreateCourtRequest, UpdateCourtRequest } from "@/types/api/turnos";

export const courtsService = {
  list(): Promise<Court[]> {
    return apiClient.get<Court[]>("/api/courts");
  },
  create(body: CreateCourtRequest): Promise<Court> {
    return apiClient.post<Court>("/api/courts", body);
  },
  update(id: string, body: UpdateCourtRequest): Promise<Court> {
    return apiClient.patch<Court>(`/api/courts/${id}`, body);
  },
  remove(id: string): Promise<void> {
    return apiClient.del<void>(`/api/courts/${id}`);
  },
};
