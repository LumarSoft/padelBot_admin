"use client";

import { Boxes, History, Loader2, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/features/productos/hooks/use-products";
import { KioscoTabs } from "@/features/kiosco/components/kiosco-tabs";
import { StockLevel } from "@/features/kiosco/components/stock-level";
import { CATEGORY_LABELS, type Product, type ProductCategory } from "@/types/api/products";

const CATEGORY_ORDER: ProductCategory[] = [
  "PELOTA",
  "BEBIDA",
  "SNACK",
  "ACCESORIO",
  "OTRO",
];

/** The plain stock sheet the front desk works with: product, how many, minimum. No prices. */
function StockSheet({ onShowHistory }: { onShowHistory: (productId: string) => void }) {
  const { data, isLoading } = useProducts();
  const products = (data ?? []).filter((p) => p.isActive);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando stock…
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBasket}
        title="Sin productos"
        description="El dueño todavía no cargó el catálogo del kiosco."
      />
    );
  }

  const byCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    acc[p.category] = [...(acc[p.category] ?? []), p];
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      {CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => (
        <div key={cat} className="overflow-hidden rounded-xl border">
          <div className="bg-muted/40 border-b px-4 py-2">
            <p className="text-sm font-medium">{CATEGORY_LABELS[cat]}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden sm:table-cell">Mínimo</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {byCategory[cat].map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <StockLevel
                      stockQuantity={product.stockQuantity}
                      lowStockThreshold={product.lowStockThreshold}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm tabular-nums sm:table-cell">
                    {product.stockQuantity !== null ? (product.lowStockThreshold ?? "—") : ""}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Historial de ${product.name}`}
                      onClick={() => onShowHistory(product.id)}
                      className="text-muted-foreground hover:text-foreground size-8"
                    >
                      <History className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

export function KioscoScreen() {
  return (
    <KioscoTabs
      first={{
        value: "stock",
        label: "Stock",
        icon: Boxes,
        render: (onShowHistory) => <StockSheet onShowHistory={onShowHistory} />,
      }}
    />
  );
}
