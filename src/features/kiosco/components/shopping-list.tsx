"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useShoppingList } from "@/features/kiosco/hooks/use-stock";
import { StockLevel } from "@/features/kiosco/components/stock-level";
import { CATEGORY_LABELS } from "@/types/api/products";

/** "Para comprar": what's at or below its minimum, ready to read out to the supplier. */
export function ShoppingList({
  onShowHistory,
}: {
  onShowHistory?: (productId: string) => void;
}) {
  const { data, isLoading } = useShoppingList();

  if (isLoading || !data) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Nada para comprar"
        description="Ningún producto está en su mínimo. Cuando algo baje del mínimo aparece acá y le llega un aviso al dueño."
      />
    );
  }

  return (
    <div className="divide-y rounded-xl border">
      {data.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onShowHistory?.(product.id)}
          disabled={!onShowHistory}
          className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors disabled:hover:bg-transparent"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-muted-foreground text-xs">
              {CATEGORY_LABELS[product.category]}
              {product.lowStockThreshold !== null &&
                ` · mínimo ${product.lowStockThreshold}`}
            </p>
          </div>
          <StockLevel
            stockQuantity={product.stockQuantity}
            lowStockThreshold={product.lowStockThreshold}
          />
        </button>
      ))}
    </div>
  );
}
