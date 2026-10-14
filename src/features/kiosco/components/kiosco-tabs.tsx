"use client";

import { useState, type ReactNode } from "react";
import { Receipt, ShoppingCart, type LucideIcon } from "lucide-react";
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

/**
 * The kiosk views shared by Productos (owner) and Kiosco (staff): a first tab of their own
 * (the priced catalog or the plain stock sheet), "Para comprar" and today's counter sales.
 * The first tab gets `onShowHistory` to open a product's ledger.
 */
export function KioscoTabs({
  first,
}: {
  first: {
    value: string;
    label: string;
    icon: LucideIcon;
    render: (onShowHistory: (productId: string) => void) => ReactNode;
  };
}) {
  const [historyOf, setHistoryOf] = useState<string | null>(null);
  const { data: toBuy } = useShoppingList();
  const Icon = first.icon;

  return (
    <>
      <Tabs defaultValue={first.value}>
        <TabsList className="max-w-full overflow-x-auto">
          <TabsIndicator />
          <TabsTab value={first.value}>
            <Icon />
            {first.label}
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
            Ventas sueltas
          </TabsTab>
        </TabsList>

        <TabsPanel value={first.value} className="flex flex-col gap-6">
          {first.render(setHistoryOf)}
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
