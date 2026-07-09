import { Lock } from "lucide-react";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductsManager } from "@/features/productos/components/products-manager";

export default async function ProductosPage() {
  const user = await requireSession();

  return (
    <div className="animate-in fade-in-50 flex flex-col gap-8 duration-500">
      <PageHeader
        title="Productos"
        description="Pelotas, bebidas, snacks y accesorios que el complejo ofrece."
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
