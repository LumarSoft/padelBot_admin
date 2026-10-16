import type { Product } from "@/types/api/products";

/** Lowercase without accents, so "agüita" finds "Aguita". */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * What a barcode scanner types: no spaces, at least one digit (EAN/UPC, or a code the club
 * printed). Mirrors the API's BARCODE_PATTERN, with a 3-character floor so a short name typed
 * by hand isn't taken for a code.
 */
export function looksLikeBarcode(text: string): boolean {
  return /^[\x21-\x7E]{3,64}$/.test(text) && /\d/.test(text);
}

/** Products whose name has every typed word in it, in catalog order. */
export function matchByName(products: Product[], query: string): Product[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return products.filter((p) => {
    const name = normalizeText(p.name);
    return words.every((word) => name.includes(word));
  });
}

/**
 * The tiles shown under the scanner: everything when nothing is typed, otherwise the name
 * matches plus products whose code starts with what was typed (so a half-typed code still
 * points at its product, but only a full scan or a click picks it).
 */
export function filterProducts(products: Product[], query: string): Product[] {
  const text = query.trim();
  if (text === "") return products;
  const byName = new Set(matchByName(products, text).map((p) => p.id));
  return products.filter(
    (p) => byName.has(p.id) || (p.barcode !== null && p.barcode.startsWith(text)),
  );
}

export type Entry =
  /** The code of a product: a scan, or a code typed in full. */
  | { kind: "code"; product: Product }
  /** A name typed by hand: the highlighted match (the first one unless arrows moved it). */
  | { kind: "name"; product: Product }
  /** Looks like a barcode nobody in the catalog has (yet). */
  | { kind: "unknown-code"; code: string }
  | { kind: "no-match"; text: string }
  | { kind: "empty" };

/**
 * What pressing Enter in the scanner means. An exact code always wins, so a scanner can never
 * pick the wrong product by a partial match; otherwise a typed name picks its highlighted
 * match, and a code-looking text with no product is a new code to load.
 */
export function resolveEntry(
  raw: string,
  products: Product[],
  options: { pickable: Product[]; highlightedId?: string | null },
): Entry {
  const text = raw.trim();
  if (text === "") return { kind: "empty" };

  const byCode = products.find((p) => p.barcode === text);
  if (byCode) return { kind: "code", product: byCode };

  const byName = matchByName(options.pickable, text);
  if (byName.length > 0) {
    const highlighted = byName.find((p) => p.id === options.highlightedId);
    return { kind: "name", product: highlighted ?? byName[0] };
  }

  if (looksLikeBarcode(text)) return { kind: "unknown-code", code: text };
  return { kind: "no-match", text };
}
