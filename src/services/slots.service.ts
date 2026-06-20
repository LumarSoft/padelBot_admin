import { apiClient } from "@/lib/api/client";
import type {
  BulkBlockResult,
  BulkBlockSlotsRequest,
  CreateSlotRequest,
  Slot,
  SlotFilters,
  UpdateSlotRequest,
} from "@/types/api/turnos";

function buildQuery(filters: SlotFilters): string {
  const params = new URLSearchParams();
  if (filters.courtId) params.set("courtId", filters.courtId);
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const slotsService = {
  list(filters: SlotFilters = {}): Promise<Slot[]> {
    return apiClient.get<Slot[]>(`/api/slots${buildQuery(filters)}`);
  },
  create(body: CreateSlotRequest): Promise<Slot> {
    return apiClient.post<Slot>("/api/slots", body);
  },
  update(id: string, body: UpdateSlotRequest): Promise<Slot> {
    return apiClient.patch<Slot>(`/api/slots/${id}`, body);
  },
  remove(id: string): Promise<void> {
    return apiClient.del<void>(`/api/slots/${id}`);
  },
  bulkBlock(body: BulkBlockSlotsRequest): Promise<BulkBlockResult> {
    return apiClient.post<BulkBlockResult>("/api/slots/bulk-block", body);
  },
};
