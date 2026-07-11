import { apiClient } from "@/lib/api/client";
import type { PlayerDetail, PlayerListItem, Player, UpdatePlayerRequest } from "@/types/api/players";

export const playersService = {
  list(search?: string): Promise<PlayerListItem[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient.get<PlayerListItem[]>(`/api/players${qs}`);
  },
  get(id: string): Promise<PlayerDetail> {
    return apiClient.get<PlayerDetail>(`/api/players/${id}`);
  },
  update(id: string, body: UpdatePlayerRequest): Promise<Player> {
    return apiClient.patch<Player>(`/api/players/${id}`, body);
  },
};
