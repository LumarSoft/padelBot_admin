"use client";

import { Input } from "@/components/ui/input";
import { CATEGORY_LABELS, type ProductCategory } from "@/types/api/products";

const CATEGORY_ORDER: ProductCategory[] = [
  "PELOTA",
  "BEBIDA",
  "SNACK",
  "ACCESORIO",
  "OTRO",
];

export interface QuantityListProduct {
  id: string;
  name: string;
  category: ProductCategory;
}

/** Parses a quantity input: a whole number ≥ 0, or null when empty/invalid. */
export function parseQuantity(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/**
 * The "planilla": every product with one numeric input, grouped by category. Nothing else on
 * purpose — the front desk rotates every few months and this has to read like a sheet of paper.
 */
export function ProductQuantityList({
  products,
  values,
  onChange,
  disabled,
  placeholder = "0",
}: {
  products: QuantityListProduct[];
  values: Record<string, string>;
  onChange: (productId: string, value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const byCategory = products.reduce<Record<string, QuantityListProduct[]>>(
    (acc, p) => {
      acc[p.category] = [...(acc[p.category] ?? []), p];
      return acc;
    },
    {},
  );

  return (
    <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
      {CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => (
        <div key={cat} className="flex flex-col gap-1">
          <p className="text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase">
            {CATEGORY_LABELS[cat]}
          </p>
          {byCategory[cat].map((product) => {
            const raw = values[product.id] ?? "";
            const invalid = raw.trim() !== "" && parseQuantity(raw) === null;
            return (
              <label
                key={product.id}
                className="hover:bg-muted/40 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5"
              >
                <span className="min-w-0 truncate text-sm">{product.name}</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={raw}
                  onChange={(e) => onChange(product.id, e.target.value)}
                  placeholder={placeholder}
                  disabled={disabled}
                  aria-invalid={invalid || undefined}
                  aria-label={`Cantidad de ${product.name}`}
                  className="h-9 w-24 shrink-0 text-right tabular-nums"
                />
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
