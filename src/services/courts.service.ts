import { apiClient } from "@/lib/api/client";
import type {
  BulkPriceAdjustRequest,
  BulkPriceAdjustResult,
  Court,
  CreateCourtRequest,
  ScheduledPriceAdjustment,
  UpdateCourtRequest,
} from "@/types/api/turnos";

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
  bulkPrice(body: BulkPriceAdjustRequest): Promise<BulkPriceAdjustResult> {
    return apiClient.post<BulkPriceAdjustResult>("/api/courts/bulk-price", body);
  },
  listScheduledAdjustments(): Promise<ScheduledPriceAdjustment[]> {
    return apiClient.get<ScheduledPriceAdjustment[]>("/api/courts/scheduled-price-adjustments");
  },
  removeScheduledAdjustment(id: string): Promise<void> {
    return apiClient.del<void>(`/api/courts/scheduled-price-adjustments/${id}`);
  },
};
