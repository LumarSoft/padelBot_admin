import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { KioscoScreen } from "@/features/kiosco/components/kiosco-screen";
import { StockActions } from "@/features/kiosco/components/stock-actions";

/**
 * The kiosk for the front desk: the point of sale (charging and loading deliveries with the
 * barcode scanner), stock, counts and today's sales. Prices and the catalog itself live in
 * Productos, which only the owner sees (the owner gets this same point of sale there).
 */
export default async function KioscoPage() {
  await requireSession();

  return (
    <div className="stagger-children flex flex-col gap-8">
      <PageHeader
        title="Kiosco"
        description="Cobrá y cargá la mercadería con el lector de códigos. También ves lo que queda y lo que hay que comprar."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StockActions />
          </div>
        }
      />
      <KioscoScreen />
    </div>
  );
}
