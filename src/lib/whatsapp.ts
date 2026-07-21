/**
 * Build a wa.me deep link from a phone number, stripping anything that is not a
 * digit (spaces, dashes, parentheses, a leading "+").
 */
export function waLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
