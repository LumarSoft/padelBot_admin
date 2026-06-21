import { Lock } from "lucide-react";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CourtsManager } from "@/features/configuracion/components/courts-manager";
import { RecurringBookingsManager } from "@/features/configuracion/components/recurring-bookings-manager";

export default async function ConfiguracionPage() {
  const user = await requireSession();

  return (
    <div className="animate-in fade-in-50 flex flex-col gap-8 duration-500">
      <PageHeader
        title="Configuración"
        description="Administrá las canchas y ajustes del club."
      />

      {user.role !== "owner" ? (
        <EmptyState
          icon={Lock}
          title="Acceso restringido"
          description="Solo el dueño del club puede acceder a la configuración."
        />
      ) : (
        <>
          <CourtsManager />
          <RecurringBookingsManager />
        </>
      )}
    </div>
  );
}
