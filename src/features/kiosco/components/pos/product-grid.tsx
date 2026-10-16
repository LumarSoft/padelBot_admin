"use client";

import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import type { PosMode } from "@/stores/pos-store";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Product,
} from "@/types/api/products";

function Tile({
  product,
  mode,
  inList,
  highlighted,
  disabled,
  onPick,
}: {
  product: Product;
  mode: PosMode;
  inList: number;
  highlighted: boolean;
  disabled: boolean;
  onPick: (product: Product) => void;
}) {
  const stock = product.stockQuantity;
  return (
    <button
      type="button"
      onClick={() => onPick(product)}
      disabled={disabled}
      title={disabled ? "No lleva control de stock: tu plan no incluye el stock del kiosco" : undefined}
      className={cn(
        "bg-card/60 hover:bg-card relative flex min-h-[4.5rem] flex-col justify-between gap-1 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
        highlighted &&
          (mode === "cobrar"
            ? "border-emerald-500/60 ring-3 ring-emerald-500/20"
            : "border-sky-500/60 ring-3 ring-sky-500/20"),
      )}
    >
      <span className="line-clamp-2 pr-6 text-sm leading-snug font-medium">{product.name}</span>
      <span className="text-muted-foreground text-xs tabular-nums">
        {mode === "cobrar"
          ? formatPrice(product.priceCents)
          : stock === null
            ? "Sin control de stock"
            : `Hay ${stock}`}
      </span>
      {inList > 0 && (
        <span
          className={cn(
            "absolute top-2 right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white tabular-nums",
            mode === "cobrar" ? "bg-emerald-600" : "bg-sky-600",
          )}
        >
          {inList}
        </span>
      )}
    </button>
  );
}

/**
 * The products as big buttons, for whatever has no barcode (a grip, a paddle rental) or when the
 * scanner isn't at hand. Grouped by category while nothing is typed; a flat list of matches
 * while searching, with the one Enter would pick highlighted.
 */
export function ProductGrid({
  products,
  searching,
  mode,
  quantities,
  highlightedId,
  isPickable,
  onPick,
}: {
  products: Product[];
  searching: boolean;
  mode: PosMode;
  /** Units of each product already in the ticket or delivery. */
  quantities: Map<string, number>;
  highlightedId: string | null;
  isPickable: (product: Product) => boolean;
  onPick: (product: Product) => void;
}) {
  const tile = (product: Product) => (
    <Tile
      key={product.id}
      product={product}
      mode={mode}
      inList={quantities.get(product.id) ?? 0}
      highlighted={product.id === highlightedId}
      disabled={!isPickable(product)}
      onPick={onPick}
    />
  );
  const gridClass = "grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-4";

  if (searching) {
    if (products.length === 0) {
      return (
        <p className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <SearchX className="size-4" />
          Ningún producto se llama así.
        </p>
      );
    }
    return <div className={gridClass}>{products.map(tile)}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {CATEGORY_ORDER.map((category) => {
        const inCategory = products.filter((p) => p.category === category);
        if (inCategory.length === 0) return null;
        return (
          <section key={category} className="flex flex-col gap-2">
            <h3 className="text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className={gridClass}>{inCategory.map(tile)}</div>
          </section>
        );
      })}
    </div>
  );
}
