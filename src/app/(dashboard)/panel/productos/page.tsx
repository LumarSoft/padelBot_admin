import { Lock } from "lucide-react";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductsManager } from "@/features/productos/components/products-manager";

export default async function ProductosPage() {
  const user = await requireSession();

  return (
    <div className="stagger-children flex flex-col gap-8">
      <PageHeader
        title="Productos"
        description="Cobrá y cargá la mercadería con el lector de códigos. Acá también están los precios, el stock y lo que hay que comprar."
      />

      {user.role !== "owner" ? (
        <EmptyState
          icon={Lock}
          title="Acceso restringido"
          description="Solo el dueño del club puede acceder al catálogo de productos."
        />
      ) : (
        <ProductsManager />
      )}
    </div>
  );
}
