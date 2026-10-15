import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { BillingScreen } from "@/features/billing/components/billing-screen";

export default async function FacturacionPage() {
  const user = await requireSession();
  // Money is the owner's business: the staff never lands here.
  if (user.role !== "owner") redirect("/panel");

  return (
    <div className="stagger-children flex flex-col gap-6">
      <PageHeader title="Facturación" description="Tu plan y tus créditos de IA." />
      <BillingScreen />
    </div>
  );
}
