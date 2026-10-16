"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Receipt, ScanBarcode, ShoppingCart, type LucideIcon } from "lucide-react";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { useShoppingList } from "@/features/kiosco/hooks/use-stock";
import { ShoppingList } from "@/features/kiosco/components/shopping-list";
import { CounterSalesToday } from "@/features/kiosco/components/counter-sales-today";
import { MovementsDialog } from "@/features/kiosco/components/movements-dialog";
import { PointOfSale } from "@/features/kiosco/components/pos/point-of-sale";

const POS_TAB = "mostrador";

/**
 * The kiosk views shared by Productos (owner) and Kiosco (staff). It opens on «Mostrador», the
 * point of sale where the counter charges and loads deliveries with the barcode scanner; then
 * a tab of each screen's own (the priced catalog or the plain stock sheet), "Para comprar"
 * and today's sales. The tab lives in the URL (`?tab=`), so a guide can open the right one;
 * the own tab gets `onShowHistory` to open a product's ledger.
 */
export function KioscoTabs({
  second,
}: {
  second: {
    value: string;
    label: string;
    icon: LucideIcon;
    render: (onShowHistory: (productId: string) => void) => ReactNode;
  };
}) {
  const [historyOf, setHistoryOf] = useState<string | null>(null);
  const { data: toBuy } = useShoppingList();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabs = [POS_TAB, second.value, "comprar", "ventas"];
  const requested = searchParams.get("tab");
  const tab = requested && tabs.includes(requested) ? requested : POS_TAB;
  const Icon = second.icon;

  function handleChange(value: unknown) {
    if (typeof value !== "string" || !tabs.includes(value)) return;
    router.replace(value === POS_TAB ? pathname : `${pathname}?tab=${value}`, { scroll: false });
  }

  return (
    <>
      <Tabs value={tab} onValueChange={handleChange}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList>
            <TabsIndicator />
            <TabsTab value={POS_TAB}>
              <ScanBarcode />
              Mostrador
            </TabsTab>
            <TabsTab value={second.value}>
              <Icon />
              {second.label}
            </TabsTab>
            <TabsTab value="comprar">
              <ShoppingCart />
              Para comprar
              {(toBuy?.length ?? 0) > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold text-white tabular-nums">
                  {toBuy!.length}
                </span>
              )}
            </TabsTab>
            <TabsTab value="ventas">
              <Receipt />
              Ventas de hoy
            </TabsTab>
          </TabsList>
        </div>

        <TabsPanel value={POS_TAB}>
          <PointOfSale active={tab === POS_TAB} />
        </TabsPanel>
        <TabsPanel value={second.value} className="flex flex-col gap-6">
          {second.render(setHistoryOf)}
        </TabsPanel>
        <TabsPanel value="comprar">
          <ShoppingList onShowHistory={setHistoryOf} />
        </TabsPanel>
        <TabsPanel value="ventas">
          <CounterSalesToday />
        </TabsPanel>
      </Tabs>

      <MovementsDialog
        productId={historyOf}
        onOpenChange={(open) => {
          if (!open) setHistoryOf(null);
        }}
      />
    </>
  );
}
