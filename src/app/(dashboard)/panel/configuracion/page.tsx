import { Lock } from "lucide-react";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfiguracionScreen } from "@/features/configuracion/components/configuracion-screen";

export default async function ConfiguracionPage() {
  const user = await requireSession();

  return (
    <div className="stagger-children flex flex-col gap-8">
      <PageHeader
        title="Configuración"
        description="Dejá tu complejo listo: cobros, canchas y turnos fijos."
      />

      {user.role !== "owner" ? (
        <EmptyState
          icon={Lock}
          title="Acceso restringido"
          description="Solo el dueño del club puede acceder a la configuración."
        />
      ) : (
        <ConfiguracionScreen clubName={user.clubName} />
      )}
    </div>
  );
}
