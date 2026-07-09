"use client";

import { useState, type FormEvent } from "react";
import {
  Loader2,
  PackagePlus,
  Pencil,
  ShoppingBasket,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/features/productos/hooks/use-products";
import type { Product, ProductCategory } from "@/types/api/products";
import { CATEGORY_LABELS } from "@/types/api/products";

const CATEGORIES: ProductCategory[] = [
  "PELOTA",
  "BEBIDA",
  "SNACK",
  "ACCESORIO",
  "OTRO",
];

function ProductForm({
  initial,
  isPending,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<Product>;
  isPending: boolean;
  onSubmit: (data: {
    name: string;
    priceCents: number;
    category: ProductCategory;
    isActive: boolean;
  }) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(
    initial?.priceCents != null ? String(initial.priceCents / 100) : "",
  );
  const [category, setCategory] = useState<ProductCategory>(
    initial?.category ?? "OTRO",
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const trimmed = name.trim();
  const priceNumber = Number(price);
  const priceValid = Number.isFinite(priceNumber) && priceNumber >= 0;
  const priceCents = Math.round(priceNumber * 100);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmed || !priceValid) return;
    onSubmit({ name: trimmed, priceCents, category, isActive });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="product-name">Nombre</Label>
        <Input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          autoFocus
          placeholder="Ej: Pelota Wilson x3"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-price">Precio (ARS)</Label>
        <Input
          id="product-price"
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Categoría</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              disabled={isPending}
              className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                category === cat
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          disabled={isPending}
          aria-label="Activar o desactivar producto"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          {isActive ? (
            <ToggleRight className="size-5 text-emerald-600" />
          ) : (
            <ToggleLeft className="size-5" />
          )}
          {isActive ? "Activo" : "Inactivo"}
        </button>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending || !trimmed || !priceValid}>
          {isPending ? "Guardando…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const createProduct = useCreateProduct();

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <PackagePlus className="size-4" />
        Nuevo producto
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
            <DialogDescription>
              Agregá un ítem al catálogo del complejo (pelotas, bebidas, snacks,
              etc.).
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            isPending={createProduct.isPending}
            onSubmit={(data) =>
              createProduct.mutate(data, { onSuccess: () => setOpen(false) })
            }
            submitLabel="Crear producto"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateProduct = useUpdateProduct();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
          <DialogDescription>
            Modificá los datos de &quot;{product.name}&quot;.
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          initial={product}
          isPending={updateProduct.isPending}
          onSubmit={(data) =>
            updateProduct.mutate(
              { id: product.id, body: data },
              { onSuccess: () => onOpenChange(false) },
            )
          }
          submitLabel="Guardar"
        />
      </DialogContent>
    </Dialog>
  );
}

export function ProductsManager() {
  const productsQuery = useProducts();
  const deleteProduct = useDeleteProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const products = productsQuery.data ?? [];

  const byCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.category;
    acc[key] = [...(acc[key] ?? []), p];
    return acc;
  }, {});

  function handleDelete(product: Product) {
    if (window.confirm(`¿Eliminar "${product.name}"?`)) {
      deleteProduct.mutate(product.id);
    }
  }

  if (productsQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando productos…
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Catálogo de productos</h2>
          <p className="text-muted-foreground text-sm">
            Pelotas, bebidas, snacks y accesorios que el complejo ofrece. Podés
            registrar consumos al confirmar un pago.
          </p>
        </div>
        <CreateProductDialog />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="Sin productos"
          description="Creá el primer producto para poder registrar consumos en las reservas."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {(CATEGORIES as ProductCategory[])
            .filter((cat) => byCategory[cat]?.length)
            .map((cat) => (
              <div key={cat} className="overflow-hidden rounded-xl border">
                <div className="bg-muted/40 border-b px-4 py-2">
                  <p className="text-sm font-medium">{CATEGORY_LABELS[cat]}</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCategory[cat].map((product) => (
                      <TableRow
                        key={product.id}
                        className={
                          !product.isActive ? "opacity-50" : undefined
                        }
                      >
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {formatPrice(product.priceCents)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={product.isActive ? "default" : "secondary"}
                            className={
                              product.isActive
                                ? "border-transparent bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                                : ""
                            }
                          >
                            {product.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Editar ${product.name}`}
                              onClick={() => setEditingProduct(product)}
                              className="text-muted-foreground hover:text-foreground size-8"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Eliminar ${product.name}`}
                              onClick={() => handleDelete(product)}
                              disabled={deleteProduct.isPending}
                              className="text-muted-foreground hover:text-destructive size-8"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
        </div>
      )}

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => {
            if (!open) setEditingProduct(null);
          }}
        />
      )}
    </>
  );
}
