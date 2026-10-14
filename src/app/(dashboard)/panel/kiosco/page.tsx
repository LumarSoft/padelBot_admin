import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { KioscoScreen } from "@/features/kiosco/components/kiosco-screen";
import { StockActions } from "@/features/kiosco/components/stock-actions";

/**
 * The kiosk for the front desk (owner and staff): stock, deliveries, counts and loose sales.
 * Prices and the catalog itself live in Productos, which only the owner sees.
 */
export default async function KioscoPage() {
  await requireSession();

  return (
    <div className="stagger-children flex flex-col gap-8">
      <PageHeader
        title="Kiosco"
        description="Lo que entra, lo que sale y lo que queda de bebidas, pelotas y grips."
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
