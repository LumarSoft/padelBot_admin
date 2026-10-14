"use client";

import { useState, type FormEvent } from "react";
import {
  BookOpen,
  Loader2,
  PackagePlus,
  Pencil,
  ShoppingBasket,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
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
import { PlanUpsell } from "@/features/plan/components/plan-upsell";
import { useFeature } from "@/features/plan/hooks/use-plan";
import type { Product, ProductCategory } from "@/types/api/products";
import { CATEGORY_LABELS } from "@/types/api/products";
import { KioscoTabs } from "@/features/kiosco/components/kiosco-tabs";
import { StockActions } from "@/features/kiosco/components/stock-actions";
import { StockLevel } from "@/features/kiosco/components/stock-level";

const CATEGORIES: ProductCategory[] = [
  "PELOTA",
  "BEBIDA",
  "SNACK",
  "ACCESORIO",
  "OTRO",
];

interface ProductFormValues {
  name: string;
  priceCents: number;
  category: ProductCategory;
  isActive: boolean;
  /** Only sent when it changed: a number (re)sets the stock, null stops tracking it. */
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
}

/** "" → null, a whole number ≥ 0 → that number, anything else → undefined (invalid). */
function parseWhole(value: string): number | null | undefined {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

function ProductForm({
  initial,
  isPending,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<Product>;
  isPending: boolean;
  onSubmit: (data: ProductFormValues) => void;
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
  const wasTracked = initial?.stockQuantity != null;
  const [trackStock, setTrackStock] = useState(wasTracked);
  // Starting to track depends on the plan; a product already tracked keeps it either way.
  const canTrack = useFeature("kioscoStock").enabled || wasTracked;
  const [stock, setStock] = useState(
    initial?.stockQuantity != null ? String(initial.stockQuantity) : "",
  );
  const [threshold, setThreshold] = useState(
    initial?.lowStockThreshold != null ? String(initial.lowStockThreshold) : "",
  );

  const trimmed = name.trim();
  const priceNumber = Number(price);
  const priceValid = Number.isFinite(priceNumber) && priceNumber >= 0;
  const priceCents = Math.round(priceNumber * 100);
  const stockValue = parseWhole(stock);
  const thresholdValue = parseWhole(threshold);
  // Tracking needs today's quantity; the minimum is optional.
  const stockValid =
    !trackStock || (typeof stockValue === "number" && thresholdValue !== undefined);

  function stockChanges(): Pick<ProductFormValues, "stockQuantity" | "lowStockThreshold"> {
    if (!trackStock) return wasTracked ? { stockQuantity: null } : {};
    return {
      ...(stockValue !== (initial?.stockQuantity ?? null) ? { stockQuantity: stockValue } : {}),
      ...(thresholdValue !== (initial?.lowStockThreshold ?? null)
        ? { lowStockThreshold: thresholdValue }
        : {}),
    };
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmed || !priceValid || !stockValid) return;
    onSubmit({ name: trimmed, priceCents, category, isActive, ...stockChanges() });
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

      <div className="flex flex-col gap-3 rounded-lg border p-3" data-help="producto-stock">
        <button
          type="button"
          onClick={() => setTrackStock((v) => !v)}
          disabled={isPending || (!canTrack && !trackStock)}
          aria-pressed={trackStock}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          {trackStock ? (
            <ToggleRight className="size-5 text-emerald-600" />
          ) : (
            <ToggleLeft className="size-5" />
          )}
          {trackStock ? "Controlo el stock" : "No controlo el stock"}
        </button>
        {trackStock ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-stock">Hay hoy</Label>
              <Input
                id="product-stock"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Ej: 24"
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-threshold">Avisar cuando queden</Label>
              <Input
                id="product-threshold"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="Ej: 6"
                disabled={isPending}
              />
            </div>
            <p className="text-muted-foreground col-span-2 text-xs">
              Cada consumo y venta descuenta solo. Cuando llega al mínimo
              aparece en «Para comprar» y te llega un aviso.
            </p>
          </div>
        ) : canTrack ? (
          <p className="text-muted-foreground text-xs">
            Si lo activás, cada venta descuenta del stock y te avisamos cuando
            queda poco. También se activa solo al cargar mercadería o contarlo.
          </p>
        ) : (
          <PlanUpsell feature="kioscoStock">
            Controlar el stock: cada venta descuenta sola y te avisamos cuando queda poco.
          </PlanUpsell>
        )}
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
        <Button
          type="submit"
          disabled={isPending || !trimmed || !priceValid || !stockValid}
          data-help="producto-guardar"
        >
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
              createProduct.mutate(
                { ...data, stockQuantity: data.stockQuantity ?? undefined },
                { onSuccess: () => setOpen(false) },
              )
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

function Catalog({
  products,
  onEdit,
  onDelete,
  deleting,
  onShowHistory,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  deleting: boolean;
  onShowHistory: (productId: string) => void;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBasket}
        title="Sin productos"
        description="Creá el primer producto para poder registrar consumos en las reservas."
      />
    );
  }

  const byCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    acc[p.category] = [...(acc[p.category] ?? []), p];
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      {CATEGORIES.filter((cat) => byCategory[cat]?.length).map((cat) => (
        <div key={cat} className="overflow-hidden rounded-xl border">
          <div className="bg-muted/40 border-b px-4 py-2">
            <p className="text-sm font-medium">{CATEGORY_LABELS[cat]}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {byCategory[cat].map((product) => (
                <TableRow
                  key={product.id}
                  className={!product.isActive ? "opacity-50" : undefined}
                >
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {formatPrice(product.priceCents)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onShowHistory(product.id)}
                      title="Ver lo que entró y salió"
                      className="hover:bg-muted/60 -mx-1.5 rounded-md px-1.5 py-0.5 transition-colors"
                    >
                      <StockLevel
                        stockQuantity={product.stockQuantity}
                        lowStockThreshold={product.lowStockThreshold}
                      />
                    </button>
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
                        onClick={() => onEdit(product)}
                        data-help="producto-editar"
                        className="text-muted-foreground hover:text-foreground size-8"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${product.name}`}
                        onClick={() => onDelete(product)}
                        disabled={deleting}
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
  );
}

export function ProductsManager() {
  const productsQuery = useProducts();
  const deleteProduct = useDeleteProduct();
  const confirm = useConfirm();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const products = productsQuery.data ?? [];

  async function handleDelete(product: Product) {
    const ok = await confirm({
      title: `¿Eliminar "${product.name}"?`,
      description:
        "Sale del catálogo. Si ya se vendió alguna vez, desactivalo en lugar de borrarlo.",
      confirmLabel: "Eliminar",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) deleteProduct.mutate(product.id);
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
      <div className="flex flex-wrap items-center justify-end gap-2" data-help="kiosco-acciones">
        <StockActions />
        <CreateProductDialog />
      </div>

      <KioscoTabs
        first={{
          value: "catalogo",
          label: "Catálogo",
          icon: BookOpen,
          render: (onShowHistory) => (
            <Catalog
              products={products}
              onEdit={setEditingProduct}
              onDelete={(product) => void handleDelete(product)}
              deleting={deleteProduct.isPending}
              onShowHistory={onShowHistory}
            />
          ),
        }}
      />

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
