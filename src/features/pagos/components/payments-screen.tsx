"use client";

import { PendingPayments } from "@/features/pagos/components/pending-payments";
import { ConfirmedPayments } from "@/features/pagos/components/confirmed-payments";

export function PaymentsScreen() {
  return (
    <div className="flex flex-col gap-6">
      <PendingPayments alwaysShow />
      <ConfirmedPayments />
    </div>
  );
}
