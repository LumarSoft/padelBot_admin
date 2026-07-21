import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentsScreen } from "@/features/pagos/components/payments-screen";

export default async function PagosPage() {
  await requireSession();

  return (
    <div className="stagger-children flex flex-col gap-8">
      <PageHeader
        title="Pagos"
        description="Confirmá las señas pendientes y revisá los pagos concretados por día."
      />
      <PaymentsScreen />
    </div>
  );
}
