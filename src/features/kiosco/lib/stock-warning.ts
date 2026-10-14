/**
 * Warning for selling more than the system thinks is on the shelf. Never blocks: the drink is
 * physically there or it isn't — the next count fixes the number. `alreadyDeducted` is what this
 * same bill already took out of stock when it was last saved, so only the units added on top of
 * it are compared with what's left.
 */
export function stockWarning(
  product: { stockQuantity: number | null } | undefined,
  requested: number,
  alreadyDeducted = 0,
): string | null {
  if (!product || product.stockQuantity === null) return null;
  if (requested - alreadyDeducted <= product.stockQuantity) return null;
  return product.stockQuantity <= 0
    ? "Sin stock en el sistema — se carga igual"
    : `En el sistema ${product.stockQuantity === 1 ? "queda 1" : `quedan ${product.stockQuantity}`} — se carga igual`;
}
