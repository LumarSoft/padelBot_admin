"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { billingService } from "@/services/billing.service";
import type { BillingOverview } from "@/types/api/billing";

export function useBilling() {
  return useQuery<BillingOverview>({
    queryKey: queryKeys.billing.overview,
    queryFn: billingService.getOverview,
  });
}

/** Starts a pack purchase and sends the owner to MercadoPago's checkout. */
export function useBuyCreditPack() {
  return useMutation({
    mutationFn: (packKey: string) => billingService.buyPack(packKey),
    onSuccess: ({ checkoutUrl }) => window.location.assign(checkoutUrl),
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Back from MercadoPago: the API checks the payment and credits the pack if it was approved. */
export function useConfirmPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseId, paymentId }: { purchaseId: string; paymentId: string }) =>
      billingService.confirmPurchase(purchaseId, paymentId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.overview });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clubs.plan });
    },
  });
}
