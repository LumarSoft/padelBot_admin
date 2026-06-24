import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentsScreen } from "@/features/pagos/components/payments-screen";

export default async function PagosPage() {
  await requireSession();

  return (
    <div className="animate-in fade-in-50 flex flex-col gap-8 duration-500">
      <PageHeader
        title="Pagos"
        description="Confirmá las señas pendientes y revisá los pagos concretados por día."
      />
      <PaymentsScreen />
    </div>
  );
}
