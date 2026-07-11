import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsScreen } from "@/features/reportes/components/reports-screen";

export default async function ReportesPage() {
  const session = await requireSession();
  if (session.role !== "owner") redirect("/panel");

  return (
    <div className="animate-in fade-in-50 flex flex-col gap-8 duration-500">
      <PageHeader
        title="Reportes"
        description="Ocupación por franja e ingresos del período — para decidir precios y promos con datos."
      />
      <ReportsScreen />
    </div>
  );
}
