"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { billingService } from "@/services/billing.service";
import type { BillingOverview } from "@/types/api/billing";

export function useBilling() {
  return useQuery<BillingOverview>({
    queryKey: queryKeys.billing.overview,
    queryFn: billingService.getOverview,
  });
}
