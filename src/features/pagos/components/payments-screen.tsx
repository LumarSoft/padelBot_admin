"use client";

import { PendingPayments } from "@/features/pagos/components/pending-payments";
import { ConfirmedPayments } from "@/features/pagos/components/confirmed-payments";
import { ReconciliationStatus } from "@/features/pagos/components/reconciliation-status";
import { UnmatchedTransfers } from "@/features/pagos/components/unmatched-transfers";

export function PaymentsScreen() {
  return (
    <div className="flex flex-col gap-6">
      <ReconciliationStatus />
      <PendingPayments alwaysShow />
      <UnmatchedTransfers />
      <ConfirmedPayments />
    </div>
  );
}
