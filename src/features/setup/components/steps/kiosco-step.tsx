"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import { StepLayout } from "@/features/setup/components/step-layout";
import { StepFooter } from "@/features/setup/components/step-footer";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
} from "@/features/productos/hooks/use-products";
import { CATEGORY_LABELS, type ProductCategory } from "@/types/api/products";
import type { StepProps } from "@/features/setup/components/setup-wizard";

/** What a padel club actually sells at the counter — one tap instead of typing it all. */
const PRESETS: { name: string; category: ProductCategory; price: number }[] = [
  { name: "Tubo de pelotas", category: "PELOTA", price: 12000 },
  { name: "Agua 500ml", category: "BEBIDA", price: 1500 },
  { name: "Gatorade", category: "BEBIDA", price: 2500 },
  { name: "Gaseosa", category: "BEBIDA", price: 2000 },
  { name: "Barrita de cereal", category: "SNACK", price: 1200 },
  { name: "Alquiler de paleta", category: "ACCESORIO", price: 5000 },
];

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[];

export function KioscoStep({ nav }: StepProps) {
  const productsQuery = useProducts();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>("BEBIDA");

  const products = productsQuery.data ?? [];
  const loadedNames = new Set(products.map((p) => p.name.toLowerCase()));

  const priceNumber = Number(price);
  const priceValid = Number.isFinite(priceNumber) && priceNumber > 0;
  const canAdd = name.trim().length > 0 && priceValid && !createProduct.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canAdd) return;
    createProduct.mutate(
      {
        name: name.trim(),
        priceCents: Math.round(priceNumber * 100),
        category,
      },
      {
        onSuccess: () => {
          setName("");
          setPrice("");
        },
      },
    );
  }

  return (
    <StepLayout
      id="kiosco"
      footer={
        <StepFooter
          nav={nav}
          skipLabel={products.length > 0 ? "Omitir por ahora" : "No tengo kiosco"}
        />
      }
    >
      <div className="border-border/60 bg-card/40 rounded-xl border p-4">
        <p className="text-sm text-pretty">
          Lo que vendés en el mostrador. Se suma a la cuenta del turno y se divide entre los
          jugadores, así al cerrar el día la caja te da.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Los de siempre</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const alreadyLoaded = loadedNames.has(preset.name.toLowerCase());
            return (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                size="sm"
                disabled={alreadyLoaded || createProduct.isPending}
                onClick={() =>
                  createProduct.mutate({
                    name: preset.name,
                    priceCents: preset.price * 100,
                    category: preset.category,
                  })
                }
              >
                {!alreadyLoaded && <Plus />}
                {preset.name}
              </Button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          Se cargan con un precio sugerido — ajustalo cuando quieras desde Productos.
        </p>
      </div>

      {productsQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando el kiosco…
        </div>
      ) : (
        products.length > 0 && (
          <div className="flex flex-col gap-2">
            {products.map((product) => (
              <Card key={product.id} size="sm" className="animate-fade-up">
                <CardContent className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {CATEGORY_LABELS[product.category]} · {formatPrice(product.priceCents)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${product.name}`}
                    onClick={() => deleteProduct.mutate(product.id)}
                    disabled={deleteProduct.isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t pt-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_9rem_9rem]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="setup-product-name">Otro producto</Label>
            <Input
              id="setup-product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cerveza"
              maxLength={80}
              disabled={createProduct.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="setup-product-price">Precio (ARS)</Label>
            <Input
              id="setup-product-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={createProduct.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Categoría</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory((v as ProductCategory) ?? "OTRO")}
            >
              <SelectTrigger disabled={createProduct.isPending}>
                <SelectValue>
                  {(v) => CATEGORY_LABELS[v as ProductCategory]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Button type="submit" variant="outline" disabled={!canAdd}>
            {createProduct.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Agregando…
              </>
            ) : (
              <>
                <Plus />
                Agregar producto
              </>
            )}
          </Button>
        </div>
      </form>
    </StepLayout>
  );
}
